/**
 * Echo
 * ---
 * Returns the value given
 */
self.onmessage = function (e) {
  // Handling arguments
  if (e.data.type === 'argv') {
    // Delete the first item in argv (it's the command name)
    e.data.content.shift()

    // With that item deleted, check if there is anything to process at all
    if (e.data.content[0]) {
      // Send the result back as an Output message
      self.postMessage({
        type: 'output',
        content: e.data.content.join(' '),
        final: true
      })
    } else {
      // If run without arguments, explain usage
      self.postMessage({ 
        type: 'output',
        content: 'Usage: echo [text]',
        final: true
      })
    }
    self.close()

  // Handling hangup signal (in practice, this will never happen)
  } else if (e.data.type === 'hangup') {
    self.close()
  }
}
