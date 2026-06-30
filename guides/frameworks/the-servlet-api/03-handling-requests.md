---
title: "Handling Requests with HttpServlet"
guide: "the-servlet-api"
phase: 3
summary: "Override doGet/doPost on HttpServlet, read params, headers, and the raw body from the request, write status, headers, and JSON to the response - the unglamorous truth beneath @GetMapping."
tags: [servlet, httpservlet, doget, dopost, httpservletrequest, httpservletresponse, http-methods]
difficulty: beginner
synonyms: ["httpservlet doget dopost", "httpservletrequest parameters", "httpservletresponse write", "servlet read request body", "servlet set status header", "servlet handle post", "servlet json response"]
updated: 2026-06-22
---

# Handling Requests with HttpServlet

In Phase 2 you saw the container create one instance of your servlet and feed every request through a
single `service` method. That `service` method is where the real work happens - but you almost never
override it directly. Instead you extend `HttpServlet`, which has already done the tedious part for you:
it looks at the HTTP method on the incoming request and routes it to a method named after that verb.

📝 **The mental model for this whole phase:** an HTTP request is two things glued together - a *method*
(GET, POST, ...) and a *payload* (the URL, headers, and body). `HttpServlet` splits those apart for you.
The method picks which of your functions runs; the payload arrives as a `HttpServletRequest` object you
read from. You write your answer into a `HttpServletResponse` object. Read request, write response. That's
the entire job. Everything a web framework does is a fancier version of exactly this.

> If "method," "header," "status code," and "body" feel fuzzy, spend ten minutes in
> [HTTP & JSON: the API Building Blocks](/guides/http-and-json-api-basics) first - this phase assumes you
> can read a raw request and response.

## HttpServlet & the doXxx methods

`HttpServlet` gives you one method per HTTP verb. You override the one(s) you care about; the container
calls the right one based on the request line:

| HTTP request | Method called |
|--------------|---------------|
| `GET /users` | `doGet` |
| `POST /users` | `doPost` |
| `PUT /users/7` | `doPut` |
| `DELETE /users/7` | `doDelete` |

Here's a servlet that handles both reading and creating - GET to list, POST to add:

```java
public class UserServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        resp.setContentType("text/plain");
        resp.getWriter().write("Here is the list of users.");
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        resp.setStatus(201); // Created
        resp.getWriter().write("A new user was created.");
    }
}
```

*What just happened:* `HttpServlet`'s built-in `service` method inspected the request line. A `GET`
landed in `doGet`; a `POST` landed in `doPost`. You never wrote a single `if (method.equals("POST"))` -
inheritance did the dispatch. Any verb you *don't* override (say `DELETE`) gets a polite automatic `405
Method Not Allowed` from the parent class, which is exactly what you want.

💡 If you ever override a `doXxx` method, don't call `super.doGet(...)` unless you mean it - the parent's
default is to return that `405`, which will clobber your response.

## Reading the request (HttpServletRequest)

The `HttpServletRequest` is the whole incoming message turned into an object. The pieces you'll reach for
constantly:

| You want… | Call |
|-----------|------|
| A query string or form field | `req.getParameter("name")` |
| A request header | `req.getHeader("Content-Type")` |
| The path after the servlet's mapping | `req.getPathInfo()` |
| The raw body (for JSON) | `req.getReader()` or `req.getInputStream()` |

`getParameter` is the workhorse. It pulls from the query string for a GET and from a URL-encoded form
body for a POST - same call, the container figures out where to look:

```java
@Override
protected void doGet(HttpServletRequest req, HttpServletResponse resp)
        throws IOException {
    String name = req.getParameter("name");   // /greet?name=Ada  ->  "Ada"
    String accept = req.getHeader("Accept");   // e.g. "application/json"

    resp.setContentType("text/plain");
    resp.getWriter().write("Hello, " + (name == null ? "stranger" : name));
}
```

*What just happened:* the container parsed `?name=Ada` off the URL and handed you the value through
`getParameter`. Note it returns `null` when the param is absent - there's no exception, so you check for
it yourself. `getHeader` reads any header by name, case-insensitively.

For a JSON API, the data doesn't arrive as named params - it's a raw body you read as a stream of text:

```java
@Override
protected void doPost(HttpServletRequest req, HttpServletResponse resp)
        throws IOException {
    StringBuilder body = new StringBuilder();
    try (BufferedReader reader = req.getReader()) {
        String line;
        while ((line = reader.readLine()) != null) {
            body.append(line);
        }
    }
    // body now holds the raw JSON text, e.g. {"name":"Ada","role":"admin"}
    String json = body.toString();

    resp.setStatus(201);
    resp.setContentType("text/plain");
    resp.getWriter().write("Received " + json.length() + " bytes of JSON.");
}
```

*What just happened:* `getReader()` gave you the request body as character text, which you drained
line by line into a string. At this point you have raw JSON - a real app would hand that string to a
parser (more on that below). The `try`-with-resources block closes the reader for you.

⚠️ **Read the body once.** `getParameter` on a POST quietly *consumes* the form body to find its values,
and `getReader`/`getInputStream` consume the body too. You can't have both, and you can't read the stream
twice - the second read comes back empty. Decide up front: form params *or* raw body, not both, and read
the body a single time.

## Writing the response (HttpServletResponse)

The response object is your outgoing message, and you build it in a specific order: status and headers
*first*, body *last*. Once you start writing the body, the status line and headers have already been sent,
so setting them afterward does nothing.

| You want… | Call |
|-----------|------|
| Set the status code | `resp.setStatus(201)` |
| Set the content type | `resp.setContentType("application/json")` |
| Set any header | `resp.setHeader("Cache-Control", "no-store")` |
| Write the body | `resp.getWriter().write(...)` |

Here's a servlet returning JSON, assembled entirely by hand:

```java
@Override
protected void doGet(HttpServletRequest req, HttpServletResponse resp)
        throws IOException {
    resp.setStatus(200);
    resp.setContentType("application/json");
    resp.setCharacterEncoding("UTF-8");

    String json = "{\"id\":7,\"name\":\"Ada\",\"role\":\"admin\"}";
    resp.getWriter().write(json);
}
```

*What just happened:* you set the status, declared the content type so the client knows to parse it as
JSON, then wrote the body string through the writer. Notice you built the JSON by hand-concatenating a
string with escaped quotes - clumsy and error-prone, but it shows there's no magic. It's just text going
down a socket.

The wire result of that code looks like this:

```http
HTTP/1.1 200 OK
Content-Type: application/json;charset=UTF-8

{"id":7,"name":"Ada","role":"admin"}
```

💡 In real code you would never hand-build that string. You'd hand an object to a JSON library - Jackson
or Gson - and let it serialize:

```java
// What you'd actually do: let Jackson turn an object into JSON text
ObjectMapper mapper = new ObjectMapper();
String json = mapper.writeValueAsString(user);  // -> {"id":7,"name":"Ada",...}
resp.setContentType("application/json");
resp.getWriter().write(json);
```

*What just happened:* the `ObjectMapper` walked the fields of your `user` object and produced the JSON
text for you - same bytes as the hand-built string, none of the escaping. This is the one part of raw
servlet work that frameworks really do save you from. Seeing it bare once is the point; you won't do it
this way again.

## By hand vs the framework

Step back and look at what all that code actually did, in order:

1. The container picked `doGet` or `doPost` based on the HTTP method.
2. You pulled values out of the request - params, headers, body.
3. You ran your logic.
4. You serialized a result and wrote it back with a status code.

💡 That list **is** what a Spring controller does - the framework has just hidden each step behind an
annotation:

```java
// Spring MVC - the same four steps, annotated
@GetMapping("/users/{id}")          // step 1: route GET to this method
public User getUser(@PathVariable int id,        // step 2: bind from the request
                    @RequestParam String fields) {
    return userService.find(id);     // step 3 + 4: return an object; Spring serializes it
}
```

*What just happened:* `@GetMapping` is doing the `doGet`-style dispatch. `@PathVariable` and
`@RequestParam` are doing your `getParameter`/`getPathInfo` reads. Returning a `User` object instead of
writing a string is the framework calling Jackson and `getWriter().write(...)` for you. Same servlet
machinery underneath - `@GetMapping` is convenience over `doGet`, nothing more. The servlet is the
unglamorous truth beneath the annotations; once you've seen it, the annotations stop being magic and start
being shorthand.

## The request and response are per-call

Here's the thread-safety thread from Phase 2, finally tied off. Remember: the container keeps *one*
instance of your servlet and runs `doGet`/`doPost` on it from many threads at once. So how is the code
above safe?

💡 Because the `req` and `resp` objects are **created fresh by the container for every single request** and
passed in as parameters. Thread A's `doGet` gets thread A's request; thread B's `doGet` gets a completely
separate request object. The shared thing (the servlet instance) holds no per-request data; the
per-request things (the request and response) aren't shared. That's the whole trick.

```java
public class CounterServlet extends HttpServlet {

    private int hits = 0; // ⚠️ DANGER: shared across all threads

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        hits++;                                  // race condition!
        int callId = req.hashCode();             // safe: per-request object

        resp.getWriter().write("Hit number " + hits);
    }
}
```

*What just happened:* `hits` is an instance field on the one shared servlet, so two threads incrementing
it at once will trample each other and lose counts - a classic race. But anything you derive from `req`
is yours alone, because `req` was minted for this one call. The rule that falls out: **keep per-request
state in local variables and in the request object, never in servlet fields.** Method-local variables
live on each thread's own stack, so they can't collide.

This per-call request object is also what makes routing possible - the next phase reads `req.getPathInfo()`
to decide *which* handler should run, letting a single servlet dispatch to many. That's the
front-controller pattern, and it's where DispatcherServlet's secret lives.

## Recap

- `HttpServlet` routes each request to a `doXxx` method by HTTP verb - override `doGet`, `doPost`, etc.;
  unhandled verbs auto-return `405`.
- Read the request with `getParameter` (query + form), `getHeader`, `getPathInfo`, and `getReader`/
  `getInputStream` for a raw JSON body.
- You can read the body **once**: `getParameter` on a POST consumes the form body, and the input
  stream/reader can't be re-read.
- Build the response status and headers *before* the body: `setStatus`, `setContentType`, `setHeader`,
  then `getWriter().write(...)`.
- Hand-writing JSON is the raw truth; real apps let Jackson/Gson serialize - and `@GetMapping` /
  `@RequestParam` / returning an object is exactly these steps with annotations on top.
- The request and response are created per request, so they're safe to use even though the servlet
  instance is shared - keep state in locals, not fields.

## Quick check

```quiz
[
  {
    "q": "A POST request arrives and your servlet only overrides doGet. What happens?",
    "choices": ["doGet runs anyway", "The container returns 405 Method Not Allowed", "The request hangs forever"],
    "answer": 1,
    "explain": "HttpServlet's default doPost returns 405 Method Not Allowed, since you didn't override it."
  },
  {
    "q": "Why is it unsafe to call getParameter and then read the body with getReader on the same POST?",
    "choices": ["getParameter is slower", "getParameter can consume the form body, so the reader comes back empty", "getReader only works on GET requests"],
    "answer": 1,
    "explain": "Reading params on a POST can consume the body; the body can only be read once, so the later read finds nothing."
  },
  {
    "q": "One servlet instance serves many threads. What makes the request/response objects safe to use?",
    "choices": ["They are synchronized with locks", "They are created fresh by the container for each request and passed in", "They are stored in static fields"],
    "answer": 1,
    "explain": "The container mints a new request and response per call and passes them as parameters, so no two threads share them."
  }
]
```

---

[← Phase 2: The Servlet Container & Lifecycle](02-the-servlet-container-and-lifecycle.md) · [Guide overview](_guide.md) · [Phase 4: Mapping & the Front-Controller Pattern →](04-mapping-and-the-front-controller.md)
