/**
 * Alert!!!
 * ----
 * Combines all input arguments. Requests a handler named 'alert' to process the result.
 */
self.onmessage = function (e) {
  // First, check if there are any arguments
  if (e.data.content[1]) {
    // Remove command name from argv list
    e.data.content.shift()

    // Request a handler named 'alert'
    self.postMessage({
      type: 'handler',
      handler: 'alert',
      content: e.data.content.join(' '),
      final: true
    })
  } else {
    // If run without arguments, explain usage
    self.postMessage({ 
      type: 'output',
      content: 'Usage: alert [message]',
      final: true
    })
  }
  self.close()
}
  