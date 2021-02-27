# Chery :cherries:

Chery is a modular Command Line Interface for the DOM and a platform for spawning Web Workers to run JavaScript files as programs. [Demo &rarr;](https://nuel.pw/chery)

Here are some features:

- Built for the DOM, no terminal emulation -- all input and output is plain old HTML and can be styled using CSS
- Commands are programs that spawn Web Workers to run JavaScript files
- Sends a hang up signal to Web Worker if the command is aborted (with CTRL+C)
- Built-in command history
- Web Workers can request a frontend handler to manipulate the DOM, show an alert, navigate to a page, etcetera
- Chery can be called programmatically from the webpage to parse commands and spawn processes

Yes, with one R.

## Installing
Load the script somewhere on the page. Then put a `<div>` somewhere with #chery as ID.

If you don't add an element, Chery will attach itself to the body of the page. This is for full page Chery that you can, for instance, run in an iframe.

## Activating
By default, Chery is inactive until you click on it. (Full page Chery is always active.) When it activates, it adds the "active" class to the its main element and will start listening to all keypresses in the browser window.

This way, you can start Chery collapsed or minimized, hiding its contents using CSS until it is activated. If you'd like Chery to be active when the page loads, add `data-autofocus="true"`.

## Customizing
Chery supports a few options for customizing using data-attributes. They are:
- `data-prefix`: The prefix for each line, defaults to `$ `.
- `data-cursor`: The character used for the cursor. By default that's `_`.
- `data-motd`: The Message Of The Day, displayed when Chery starts.
- `data-autofocus`: Activates Chery on page load, defaults to `false`.
- `data-memory`: How many commands to remember in command history. Defaults to the last 100.
- `data-folder`: The folder where Chery should look for programs. Defaults to `./programs`

Here's an example of a fully customized Chery:
```html
<div id="chery" data-prefix="> " data-cursor="*" data-motd="Hi! Welcome to my website" data-autofocus="true" data-memory="999" data-folder="https://example.com/chery_programs/">
```

## Writing programs for Chery
When you run a command, Chery tries to find a JavaScript file with the same name inside the folder `./programs`. (You can set this to a different folder with `data-folder`)

To add a command, simply add a JavaScript file with the name you want the command to be. For example, `help.js` adds a command to Chery called `help`. This repo has a few examples already.

### Outputting text
To make a program output text to the screen, send a message from your WebWorker script like this:
```javascript
self.postMessage({ type: 'output', content: 'Hello <em>World</em>', final: true })
self.close()
```
The `final` option tells Chery to insert a new line and display the prompt and cursor again. You should omit this option if you want to output multiple messages from a program.

### Adding arguments
Whenever you run a command, Chery spawns a Web Worker and immediately sends it a message in the following format:
```javascript
{
  type: 'argv',
  content: [...]
}
```
Where `content` is an array of all arguments entered. Like in C, the first argument is the name of the command itself. For instance, if you run `echo hello`, Chery will send the following message to the Web Worker:
```javascript
{
  type: 'argv',
  content: ['echo', 'hello']
}
```

This means you can read out the arguments inside your WebWorker script like so:

```javascript
self.onmessage = e => {
  if (e.data.type === 'argv') {
      const arguments = e.data.content
  }
}
```

Check out `echo.js` in the repo to see a basic example of a Chery program.


### Making Chery interact with your webpage
If you want Chery to do things like opening tabs, navigating to other pages, adding or removing classes on other elements on the webpage, etcetera, you'll need a response handler.

A response handler is an object with a `type` string and a `parse` function. It takes data that a Web Worker has sent and uses it on the webpage. You can add them on your page after loading Chery, like so:
```javascript
chery.addResponseHandler({
    type: 'name', // A name for the handler, can be anything you want
    parse: data => {
        // Do something with the data from the Web Worker
    }
})
```
Let's say you want to write a Chery program called `opengoogle`, a command that makes the page navigate to Google.

To do this, inside your Web Worker program, you could request a response handler called `navigate` and send it a URL to navigate to:

```javascript
self.postMessage({
    type: 'requestHandler',
    handler: 'navigate',
    href: 'https://google.com'
})
```

Then, on your webpage, you can create the `navigate` handler:
```javascript
chery.addResponseHandler({
    type: 'navigate',
    parse: data => {
        window.location.href = data.href
    }
})
```

Now, whenever you run the command `opengoogle`, the Web Worker will send a URL through Chery back to the webpage and the `navigate` handler will use this URL to navigate away from the page.

### Writing advanced programs

Programs can do all sorts of things, way beyond the idea of just processing arguments given in a command. The currently active Web Worker can always be accessed at `chery.proc`. You can send messages to an active program containing data to be processed using `chery.proc.postMessage({})`. Programs can run indefinitely until their Web Worker is closed or a hang-up signal is sent. (Using CTRL+C)


## Using Chery programmatically

Chery attaches itself to window.chery and can be called from anywhere on the page. You can use this to, for example, create a button that executes a Chery command when clicked. Here are all functions that are available:

### `chery.print(text)`
Prints the specified string `text` as output of a command

### `chery.line()`
Prints a new line and adds the prefix and cursor (By default: "chery $")

### `chery.insert(text)`
Inserts one or multiple characters in the current line

### `chery.delete()`
Has to be run as `chery[delete]()`. Deletes the last character from the current line

### `chery.parse()`
Parses whatever is currently written in the prompt

### `chery.log(text)`
Logs the specified text to the screen

### `chery.error(text)`
Logs errors inside a `<span class="error">` tag so they can be styled

### `chery.exec(command)`
Inserts the specified text into Chery and parses it

### `chery.toggle()`
Toggle Chery's active state

### `chery.hideCursor()`
Hides the cursor

### `chery.addResponseHandler(handler)`
Adds a response handler. This needs to be an object with a `type` (String) and a `handler` (function).

The `chery` object also has several useful properties that can be accessed. They are:

### `chery.currentLine`
The current line in the prompt

### `chery.proc`
The current Web Worker spawned by Chery

### `chery.history`
An array containing the last typed commands

### `chery.active`
Whether or not Chery is active