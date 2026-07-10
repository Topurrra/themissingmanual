---
title: "Error Handling Done Right"
guide: "spring-boot-from-zero"
phase: 7
summary: "Turn raw exceptions into honest HTTP responses: per-controller @ExceptionHandler, app-wide @RestControllerAdvice, the right status code for each failure, and one consistent error body with Spring's ProblemDetail."
tags: [spring-boot, error-handling, exception-handler, controller-advice, http-status, problem-detail, rest]
difficulty: intermediate
synonyms: ["spring exception handling", "spring @ExceptionHandler @ControllerAdvice", "spring rest error response", "spring http status codes", "spring problemdetail rfc 7807", "spring global exception handler"]
updated: 2026-07-10
---

# Error Handling Done Right

Your API works on the happy path. In [Phase 6](06-service-layer-and-validation.md) the service started
throwing real exceptions when things go wrong — a `DuplicateIsbnException` when an ISBN already exists, and
Spring's own `MethodArgumentNotValidException` when `@Valid` rejects a bad request body. The question this
phase answers: **what does the client actually see when one of those is thrown?**

**An exception is not the answer the client gets — it's a signal you translate into one.** Your service
speaks in Java exceptions ("this book wasn't found," "this ISBN is a duplicate"). Your client speaks HTTP
("404," "409," "400"). Error handling is the layer that translates between those two languages. Skip it,
and Spring picks a translation for you — and it's bad.

If you've read the Java side of this, the exception machinery itself — throwing, catching, the
checked/unchecked split — is covered in [Errors & I/O](/guides/java-from-zero/07-errors-and-io). This phase
is about what Spring does with an exception once it escapes your code.

## The default is bad

Let's see what happens when you throw something and *don't* handle it. Suppose a `GET /api/books/999`
hits a book that doesn't exist, and your service throws:

```java
@Service
public class BookService {

    private final BookRepository books;

    public BookService(BookRepository books) {
        this.books = books;
    }

    public BookResponse findById(Long id) {
        Book book = books.findById(id)
            .orElseThrow(() -> new BookNotFoundException(id));   // nothing catches this
        return toResponse(book);
    }
}
```

*What just happened:* `findById` on the repository returns an `Optional<Book>` (the standard "maybe there's
a row, maybe not" wrapper). When it's empty, `orElseThrow` fires our `BookNotFoundException`. We never
catch it, so it unwinds straight out of the controller and into Spring's hands. Spring has to turn it into
*some* HTTP response — and with no instructions from you, here's the JSON it produces:

```json
{
  "timestamp": "2026-06-22T10:15:30.123+00:00",
  "status": 500,
  "error": "Internal Server Error",
  "path": "/api/books/999"
}
```

*What just happened:* ⚠️ Spring's default for *any* uncaught exception is **500 Internal Server Error** —
the status that means "the server broke." But the server didn't break; the client asked for a book that
isn't there. A 500 says "this is our fault, try again later," when the honest answer is "that book doesn't
exist, stop asking." The status is a lie, and nothing in the body names *which* book or *why*. (Hit the
same endpoint from a browser and you may get the infamous **Whitelabel Error Page** instead of JSON.)

It gets worse in development: depending on your settings, that body can include `"trace"` with the full
Java stack trace, leaking your class names, file paths, and internal structure to anyone who pokes the API.
The default is bad on two counts — **wrong status** and **leaked or useless body**. Everything below fixes
both.

## Per-controller `@ExceptionHandler`

The narrowest fix: a method *inside a controller* that catches a specific exception type and turns it into
a clean response.

📝 An `@ExceptionHandler` method says "if this controller throws *this* exception type, don't let it
escape — run me instead, and my return value becomes the response." You annotate the method with the
exception class it handles and a `@ResponseStatus` for the HTTP code you want.

```java
@RestController
@RequestMapping("/api/books")
public class BookController {

    private final BookService service;

    public BookController(BookService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public BookResponse get(@PathVariable Long id) {
        return service.findById(id);   // may throw BookNotFoundException
    }

    @ExceptionHandler(BookNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)            // 404
    public Map<String, Object> handleNotFound(BookNotFoundException ex) {
        return Map.of(
            "error", "book_not_found",
            "message", ex.getMessage()
        );
    }
}
```

*What just happened:* When `service.findById(id)` throws `BookNotFoundException`, Spring sees that this
controller has an `@ExceptionHandler` registered for exactly that type, so it calls `handleNotFound`
instead of falling back to the generic 500. The `@ResponseStatus(HttpStatus.NOT_FOUND)` sets the status to
**404**, and the returned map becomes the JSON body. Now the client gets:

```json
{
  "error": "book_not_found",
  "message": "No book found with id 999"
}
```

*What just happened:* Honest status (404, "that's not here"), and a body that names the problem. The catch:
this handler lives in `BookController` and only covers `BookController`. Add an `AuthorController` tomorrow
that also throws `BookNotFoundException`, and you'd have to copy the handler there too. Per-controller
handlers are fine for a one-off, controller-specific case — but for anything your whole app shares, copying
them everywhere is exactly the duplication the next section kills.

## Global handling with `@RestControllerAdvice`

📝 A class annotated `@RestControllerAdvice` is a **single, app-wide home for exception handling**. Every
`@ExceptionHandler` method inside it applies to *every* controller in the application. You write the
exception→response mapping once, and the whole API gets consistent errors for free.

(`@ControllerAdvice` is the same idea for server-rendered views; `@RestControllerAdvice` is just
`@ControllerAdvice` + `@ResponseBody`, so the return values are serialized to JSON — that's the one you
want for a REST API.)

Here's one class that handles the three cases every API needs: not-found, validation failure, and a
catch-all fallback.

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. Our own "not found" -> 404
    @ExceptionHandler(BookNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, Object> handleNotFound(BookNotFoundException ex) {
        return Map.of("error", "book_not_found", "message", ex.getMessage());
    }

    // 2. Bean Validation failure (the @Valid from Phase 6) -> 400, with per-field detail
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fields = new HashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            fields.put(fe.getField(), fe.getDefaultMessage());
        }
        return Map.of("error", "validation_failed", "fields", fields);
    }

    // 3. Anything we didn't anticipate -> 500 (but a CLEAN 500, no stack trace leaked)
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Map<String, Object> handleUnexpected(Exception ex) {
        return Map.of("error", "internal_error", "message", "Something went wrong on our end.");
    }
}
```

*What just happened:* This one class is now the translation layer for the entire app. Handler 1 turns our
`BookNotFoundException` into a 404 from any controller. Handler 2 catches the `MethodArgumentNotValidException`
that `@Valid` throws and walks `getBindingResult().getFieldErrors()` to build a tidy field→message map — far
cleaner than Spring's noisy default. Handler 3 is the safety net: `Exception.class` catches *everything
else*, so an unexpected bug still produces a deliberate 500 with a generic message instead of leaking internals.

💡 Spring picks the **most specific** matching handler. A `BookNotFoundException` matches both handler 1 and
the `Exception` catch-all in handler 3 — Spring chooses 1 because it's the closest match. That's what lets
the catch-all sit there as a backstop without swallowing the cases you handle precisely.

A validation failure now returns the shape you actually want:

```json
{
  "error": "validation_failed",
  "fields": {
    "title": "title is required",
    "isbn": "isbn must be 13 digits"
  }
}
```

*What just happened:* The `message` strings you wrote on the DTO's constraints back in Phase 6 come straight
back to the client, keyed by field — one consistent shape, produced in one place, for every endpoint that
uses `@Valid`.

## Honest HTTP status codes

The hardest part of error handling usually isn't the wiring — it's choosing the *right* status. The status
code is the first thing a client reads, and machines route on it (retry on 5xx, fix-your-request on 4xx),
so getting it right matters. Here's the working map for an API like ours:

| Status | Meaning | When you return it |
|--------|---------|--------------------|
| **400** Bad Request | The request itself is malformed | Unparseable JSON, a missing required field, wrong type |
| **401** Unauthorized | You're not authenticated | No login / no valid token (covered in [Phase 9](09-security-with-spring-security.md)) |
| **403** Forbidden | Authenticated, but not allowed | Logged in, but lacking permission for this action |
| **404** Not Found | The resource doesn't exist | `GET /api/books/999` where 999 isn't a real id |
| **409** Conflict | The request fights current state | Creating a book whose ISBN already exists (our `DuplicateIsbnException`) |
| **422** Unprocessable | Syntactically fine, semantically invalid | Failed business-rule validation (some teams use this where others use 400) |
| **500** Server Error | *You* broke, not the client | An unexpected exception, a NullPointerException, a DB outage |

📝 The dividing line that resolves most arguments: **4xx means the client's fault** (don't retry the same
thing, fix it), **5xx means the server's fault** (the request was reasonable; something on our end failed).
That's exactly why the default 500 for a missing book was wrong — a missing book is a 4xx situation.

So our `DuplicateIsbnException` from Phase 6 deserves a **409 Conflict**: the request was well-formed, but
it conflicts with a book that already exists. Wire it into the advice class:

```java
@ExceptionHandler(DuplicateIsbnException.class)
@ResponseStatus(HttpStatus.CONFLICT)             // 409
public Map<String, Object> handleDuplicate(DuplicateIsbnException ex) {
    return Map.of("error", "duplicate_isbn", "message", ex.getMessage());
}
```

*What just happened:* A duplicate ISBN now returns 409, which tells the client precisely what kind of
problem this is — a conflict with existing state, not a server failure and not a malformed request. They
know not to blindly retry; they need to change the ISBN.

⚠️ **Never return a 200 with an error inside the body.** It's tempting to send
`{ "success": false, "error": "..." }` with a 200 OK, but it's a trap: every monitoring tool, proxy, retry
policy, and client library reads the *status* to decide if a call succeeded. A 200 says "all good," so a
failure dressed as 200 sails past all of them silently. Put the failure in the status code where the
machinery can see it.

## Consistent error shape with `ProblemDetail`

We've been returning ad-hoc maps — fine, but every handler invents its own keys (`error` here,
`message` there), and clients have to learn each shape. Spring Boot ships a standard you can adopt instead.

📝 **`ProblemDetail`** is Spring's built-in implementation of **RFC 7807** ("Problem Details for HTTP
APIs") — an internet standard for error bodies. It gives every error the same predictable fields: `type`
(a URI identifying the problem kind), `title` (a short human label), `status` (the HTTP code, mirrored into
the body), and `detail` (a human-readable explanation), plus any custom fields you tack on. Use it
everywhere and clients can parse *one* shape, forever.

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BookNotFoundException.class)
    public ProblemDetail handleNotFound(BookNotFoundException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        pd.setTitle("Book not found");
        pd.setProperty("errorCode", "book_not_found");   // custom field, allowed by the spec
        return pd;
    }

    @ExceptionHandler(DuplicateIsbnException.class)
    public ProblemDetail handleDuplicate(DuplicateIsbnException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        pd.setTitle("Duplicate ISBN");
        pd.setProperty("errorCode", "duplicate_isbn");
        return pd;
    }
}
```

*What just happened:* `ProblemDetail.forStatusAndDetail` builds the standard body and sets the HTTP status
in one call — no more `@ResponseStatus`, because the status now lives *in* the `ProblemDetail` itself. We
add a `title` and a custom `errorCode` property for clients that want to switch on a stable code. A 404 now
serializes to:

```json
{
  "type": "about:blank",
  "title": "Book not found",
  "status": 404,
  "detail": "No book found with id 999",
  "errorCode": "book_not_found"
}
```

*What just happened:* Every error in your API can now share this exact skeleton — `type`, `title`,
`status`, `detail` — so a client writes its error-parsing code *once*. (`type` defaults to `about:blank`
when you don't supply a problem-specific URI; that's the spec's "nothing fancier than the status" value.)
The content type even comes back as `application/problem+json`, the standard's official media type, so
clients can detect a problem response by its type alone.

💡 **Good error handling is a contract.** A predictable status code plus a predictable body means clients
can build robust handling once and trust it across every endpoint — the same way the validation 400s from
Phase 6 gave a consistent shape for bad input. Switch those to `ProblemDetail` too and your *entire* API
speaks one error language, the foundation the tests in [Phase 8](08-testing-spring-boot.md) assert on.

## Recap

1. **The default is bad.** An uncaught exception becomes a generic **500** with a useless (or
   internals-leaking) body — even when the real problem is a 4xx the client caused. You must translate
   exceptions into honest responses yourself.
2. **`@ExceptionHandler` catches a specific type** and turns it into a chosen status + body. Inside a
   controller it's local to that controller — good for one-offs, duplicative for anything shared.
3. **`@RestControllerAdvice` centralizes handling app-wide.** One class maps not-found → 404, validation →
   400, and a `Exception.class` catch-all → a clean 500. Spring always picks the most specific handler.
4. **Pick the honest status.** 4xx = client's fault (400 bad input, 401/403 auth, 404 missing, 409
   conflict, 422 validation); 5xx = server's fault. ⚠️ Never return 200 with an error body — every tool
   routes on the status code.
5. **`ProblemDetail` gives one consistent shape (RFC 7807):** `type`, `title`, `status`, `detail`, plus
   custom properties, served as `application/problem+json`. Use it everywhere so clients parse errors once.
6. **Error handling is a contract.** Predictable status + predictable body across every endpoint is what
   makes your API trustworthy — connect it to the Phase 6 validation 400s for a single error language
   end to end.

## Quick check

Make sure the translation layer and its status-code rules stuck:

```quiz
[
  {
    "q": "Your service throws an uncaught BookNotFoundException for GET /api/books/999. With no exception handling configured, what does the client receive?",
    "choices": [
      "A 500 Internal Server Error with a generic (or stack-trace-leaking) body, even though the real problem is the client's",
      "A 404 Not Found automatically, because Spring detects the word 'NotFound' in the exception name",
      "An empty 200 OK response",
      "Nothing — the connection hangs until it times out"
    ],
    "answer": 0,
    "explain": "Spring's default for any uncaught exception is 500 Internal Server Error, which falsely blames the server for what is really a client asking for a missing resource. The body is useless and may even leak a stack trace. You have to translate the exception into the honest status (404) yourself."
  },
  {
    "q": "What is the key advantage of @RestControllerAdvice over a per-controller @ExceptionHandler?",
    "choices": [
      "Its @ExceptionHandler methods apply to every controller in the app, so you write the exception-to-response mapping once instead of copying it into each controller",
      "It runs faster because it skips the controller layer entirely",
      "It is the only place @Valid validation can be triggered",
      "It automatically converts every exception into a 200 OK"
    ],
    "answer": 0,
    "explain": "@RestControllerAdvice is a single, app-wide home for exception handling. Handlers inside it apply to all controllers, giving the whole API consistent errors from one class. A per-controller @ExceptionHandler only covers its own controller, so shared cases would have to be copied everywhere."
  },
  {
    "q": "A client tries to create a book whose ISBN already exists. Which HTTP status is the honest choice?",
    "choices": [
      "409 Conflict — the request is well-formed but conflicts with existing state",
      "500 Internal Server Error — any failure is a server error",
      "200 OK with \"success\": false in the body so the client can read the reason",
      "404 Not Found — the new book does not exist yet"
    ],
    "answer": 0,
    "explain": "A duplicate ISBN is a 409 Conflict: the request was valid, but it fights the current state of the data. 500 would falsely blame the server; 404 is for missing resources; and returning 200 with an error body hides the failure from every tool that routes on the status code."
  }
]
```

---

[← Phase 6: The Service Layer, DTOs & Validation](06-service-layer-and-validation.md) · [Guide overview](_guide.md) · [Phase 8: Testing Spring Boot Apps →](08-testing-spring-boot.md)
