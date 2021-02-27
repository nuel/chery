/**
 * 🍒 Chery 🍒
 * A drop-in CLI for on the web with no dependencies
 * v1.0.0
 */
// Store element, prefix and cursor
const $el = document.getElementById('chery') || document.body
const $pre = $el.dataset.prefix || 'chery@1.0.0 $ '
const $cur = $el.dataset.cursor || '_'
const $folder = $el.dataset.folder || './programs/'

// Create main element
const chery = window.chery = document.createElement('div')
$el.appendChild(chery)

// Prints the specified text as output of a command
chery.print = text => {
  // If \n is being used, loop for each line
  text.split('\n').forEach(line => {
    // Create a new <p> element
    chery.hideCursor()
    chery.currentLine = document.createElement('p')

    // Append to the main element and insert the content
    chery.appendChild(chery.currentLine)
    chery.insert(line || '&nbsp')
  })

  // Scroll to the last line
  window.scrollTo(0, document.body.scrollHeight)

  // Return chery so call can be chained
  return chery
}

// Moves all business to a new, blank line
chery.line = () => {
  chery.print($pre)
  return chery
}

// Inserts one or multiple characters into the current line
chery.insert = text => {
  // Is there a current line?
  if (chery.currentLine) {
    chery.hideCursor()
    chery.currentLine.innerHTML += text + $cur
    return chery
  }
  return false
}

// Deletes last character from the current line
chery['delete'] = () => {
  if (chery.currentLine.innerHTML.length > $pre.length + $cur.length && chery.currentLine.innerHTML.slice(0, $pre.length) === $pre) {
    chery.hideCursor()
    chery.currentLine.innerHTML = chery.currentLine.innerHTML.slice(0, -1) + $cur
    return chery
  }
  return false
}

// Parses the current line, invokes appropriate scripts, adds a new line
chery.parse = () => {
  // Catch arguments and split into array
  chery.hideCursor()
  const argv = chery.currentLine.innerHTML.slice($pre.length).split(' ')

  // Always push the command onto the history stack, trim history to chery.memory
  chery.history.push(chery.currentLine.innerHTML)
  chery.history.splice(0, chery.history.length - chery.memory)
  chery.iterator = chery.history.length

  // If there are arguments at all and the argument is not 'clear'
  if (argv[0] && argv[0] !== 'clear' && /^[\w\-]+$/.test(argv[0])) {
    const url = $folder + argv[0] + '.js'

    // Check if the command can be found
    const xhr = new window.XMLHttpRequest()
    xhr.open('GET', url)
    xhr.send()
    xhr.onreadystatechange = () => {
      if (xhr.status === 404) {
        chery.error('chery: ' + argv[0] + ': command not found')
        xhr.abort()
        return false
      }
    }

    // Spawn a Web Worker
    if (window.Worker) {
      chery.proc = new Worker(url)
      chery.proc.postMessage({
        type: 'argv',
        content: argv
      })
      // When Web Worker sends a message back, decide what to do
      chery.proc.onmessage = e => {
        switch(e.data.type) {
          // For output messages, print output
          case 'output':
            chery.print(e.data.content)
            break
          case 'error':
            chery.error(e.data.content)
            break
          // If a handler is requested, pass data to the handler function, if available
          case 'handler':
            if (chery.handler && e.data.handler) {
              const handler = chery.handler[e.data.handler]
              if (!handler) {
                // No handler found
                chery.error(`No handler found for '${e.data.handler}'`)
                return false
              }
              // Check if this handler has a parse function
              if (typeof handler.parse === 'function') handler.parse(e.data)
            }
            break
          // If no message type matches, do nothing
          default:
            break
        }
        // Is this the final message?
        if (e.data.final) chery.line()
      }
      return chery
    } else {
      // window.Worker doesn't exist
      chery.error('Chery was unable to spawn a web worker. Your browser may not be supported.')
      return false
    }
    // Handle 'clear' directly, no web worker needed
  } else if (argv[0] === 'clear') {
    chery.innerHTML = ''
    chery.line()
    return chery
  } else {
    chery.line()
    return false
  }
}

// Logs the text to the screen
chery.log = text => {
  // Put the line on the screen
  chery.print(text)
  // Create a new one
  chery.line()
  // Return text for programmatic Chery users
  return text
}

// Logs errors inside a span that can be styled
chery.error = text => {
  chery.log(`<span class="error">${text}</span>`)
  return text
}

// Execute a command
chery.exec = command => {
  chery.line().insert(command).parse()
}

// Toggles Chery's active state
chery.toggle = () => {
  chery.active = !chery.active
  $el.classList.toggle('active')
  return chery
}

// Remove the cursor from the screen so it can be re-added
chery.hideCursor = () => {
  if (chery.currentLine && chery.currentLine.innerHTML.slice(-1) === $cur) {
    chery.currentLine.innerHTML = chery.currentLine.innerHTML.slice(0, -1)
  }
}

// Adds a response handler
chery.addResponseHandler = handler => {
  if (handler.type) chery.handler[handler.type] = handler
}

// Initialize Chery
chery.currentLine
chery.history = []
chery.iterator = 0
chery.memory = $el.dataset.memory || 100
chery.active = false
chery.handler = {}
if ($el.dataset.autofocus || $el === document.body) chery.toggle()

// Bind clicks on Chery element
chery.addEventListener('mousedown', e => {
  chery.active = true
})

// Bind keypresses
document.addEventListener('keypress', e => {
  if (chery.active) {
    if (e.key === 'Enter') {
      // On enter, parse the current line
      chery.parse()
    } else if (e.keyCode) {
      // For all other keypresses, attempt to print them as a string
      chery.insert(String.fromCharCode(e.keyCode))
    }
  }
})

// Bind key inputs
document.addEventListener('keydown', e => {
  if (chery.active) {
    // Handle backspaces
    if (e.key === 'Backspace' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault()
      chery['delete']()

    // Handle CTRL + C
    } else if (e.key === 'c' && e.ctrlKey) {
      // Send hangup signal to Web Worker
      if (chery.proc) chery.proc.postMessage({ type: 'hangup' })
      chery.line()

    // History: Arrow up and down step through history using chery.iterator
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (chery.iterator > 0) chery.iterator --
      if (chery.history[0]) chery.currentLine.innerHTML = chery.history[chery.iterator] + $cur

    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (chery.history[chery.iterator + 1]) {
        chery.iterator ++
        chery.currentLine.innerHTML = chery.history[chery.iterator] + $cur
      } else {
        // At the end of history is always a blank line
        chery.currentLine.innerHTML = $pre + $cur
      }
    }
  }
})

// Ready to go!
document.addEventListener('DOMContentLoaded', $e => {
  // Display welcome message
  chery.print($el.dataset.motd || 'Login: [' + $e.timeStamp + ']\n~ Welcome to Chery ~ Type \'help\' for help')

  // Create a new line for input
  chery.line()
})