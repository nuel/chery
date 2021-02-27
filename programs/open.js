/**
 * Navigate
 * ----
 * Requests a handler to navigate to the URL given
 */
self.onmessage = function (e) {
    // First, check if there are any arguments
    if (e.data.content[1]) {  
      // Check if there's http(s) in front, if not, add it
      let url = e.data.content[1]
      if (url.slice(0,4) !== 'http') url = 'https://' + url

      // Request a handler named 'open' to parse this URL
      self.postMessage({
        type: 'handler',
        handler: 'open',
        href: url,
        final: true
      })
    } else {
      // If run without arguments, explain usage
      self.postMessage({ 
          type: 'output',
          content: 'Usage: open [URL]',
          final: true
        })
    }
    self.close()
  }
    