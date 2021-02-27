/**
 * Help
 * ---
 * Returns a help message
 */
var content =
`
-------------------------------------------------------
HELP
-------------------------------------------------------
Chery is a command line interface for the DOM that uses
Web Workers to run JavaScript files as programs.

Try these commands:
- help
- echo [text]
- alert [text]
- open [url]
`
self.postMessage({ type: 'output', content, final: true })
self.close()
