# Marcher browser engine

Upstream: https://github.com/Stermere/Checkers-Engine

Source commit: `1fa785edbe8003445163a63f00f04a4c0b77254b`.
GUI ABI reference: https://github.com/Stermere/Marcher_Engine_GUI/tree/26dcb22

The four engine files came from the `engine-latest` release asset
`marcher-wasm.tar.gz` at
https://github.com/Stermere/Checkers-Engine/releases/download/engine-latest/marcher-wasm.tar.gz .
The release page identified this build as commit `1fa785e`. The downloaded
archive was 220,762 bytes with SHA-256
`4f615f8a92be7c77c9acb2748bc5ad829b3a98a7a6b7c8a36425d1715e4eaf62`.
Because `engine-latest` is a moving release name, verify that hash before
replacing or rebuilding these pinned assets.

| File | SHA-256 |
| --- | --- |
| `marcher.js` | `1833036c5069c26d57ee9f8c889d05e7ae8d56359c8cf982aaf1aa8b18a36500` |
| `marcher.wasm` | `21b44a3b5724848f420d5c44961aa8c762766a506ab84a7c0123f97ea333ce42` |
| `marcher-scalar.js` | `27fb33dbd875c35f4301997c56c34777285c8aa0908cb2ab0d7b4614a0fda9c3` |
| `marcher-scalar.wasm` | `6b3d8ad660e362ced20a394ea39067b96f3a93647eedf5fcfa7025b129c6c45d` |

Upstream license: MIT. The full notice is in `LICENSE` beside the binaries.
`adapter-worker.js` is project code. Marcher's NNUE is embedded in the WASM
binary; no tablebase assets are included.
