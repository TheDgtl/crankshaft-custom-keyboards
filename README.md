# Crankshaft Custom Keyboards

This plugin allows you to load custom keyboards directly in the Settings menu.

Keyboards are loaded from the ~/homebrew/keyboards/ folder, and consist of a simple JSON file and CSS file, organised into folders.

For example, an RGB keyboard may live in the following files:  
`~/homebrew/keyboards/rgb/keyboard.json`  
`~/homebrew/keyboards/rgb/keyboard.css`

This plugin is only compatible with the gamepad/Steam Deck UI.


# Creating Keyboards

To create a keyboard, create a new folder on your Deck under ~/homebrew/keyboards, named after your skin. Note that spaces should be avoided in the folder name.

Once a folder has been created, create a new file inside called 'keyboard.json', with contents similar to the following, replacing the values with your own:
```
{
    "name": "Custom Keyboard",
    "version": "v1.0",
    "author": "Drakia",
    "class": "CustomKeyboard"
}
```

The 'name' property is what's shown in the Keyboard dropdown, and the 'class' property is the CSS class that your keyboard should use. The other properties are currently unused, but may be useful in the future.

Next create a 'keyboard.css' file in your folder, and work on creating your new keyboard stylesheet. You will want to use the same class as the 'class' property in the JSON file for your keyboard class:
```
.CustomKeyboard {
    --key-color: #ff54af;
    ...
}
```
