const readline = require("readline");
const readlineInterface = readline.createInterface(
  process.stdin,
  process.stdout
);

function ask(questionText) {
  return new Promise((resolve, reject) => {
    readlineInterface.question(questionText, resolve);
  });
}

//Setting up the sleep function to allow for pauses in the execution of items. This delays them appearing in the terminal for a settable increment of time.
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

//attempt to exec word-wrap, I believe it works, but didn't want all of the code to not function, so I commented it out. Would then have to put wrap() around all strings and can edit the width in that wrap function.
//NOTE: PLEASE PUT $ npm install --save word-wrap INTO YOUR TERMINAL BEFORE RUNNING GAME TO ENABLE THE WORD WRAPPING.
// const { exec } = require("child_process");

// exec("npm install --save word-wrap", (error, stdout, stderr) => {
//     if (error) {
//         console.log(`error: npm package not installed.\nplease enter npm install --save word-wrap`);
//         return;
//     }
//     if (stderr) {
//         console.log(`stderr: ${stderr}`);
//         return;
//     }
//     console.log(`stdout: npm word wrap successfully installed.`);
// });

// //setting the wrap requirement.
// const wrap = require('word-wrap')

//creating a word wrap function that can surround a string and supply a width (80 for this project).
var wrap = (string, width) =>
  string.replace(
    new RegExp(`(?![^\\n]{1,${width}}$)([^\\n]{1,${width}})\\s`, "g"),
    "$1\n"
  );

//calling game start function.
start();

//creating start async function with welcome message and based on input either restarts the function or launches the game function.
async function start() {
  const welcomeMessage = wrap(
    `Hello and welcome to your adventure to recover a priceless family heirloom!\nIn this game you can use phrases like 'go ___', 'take ___', 'use___', or 'examine ___' to guide your character through the adventure.\nAt anytime you can check your inventory with 'i'\nAre you ready? (y or n)\n>_`,
    80
  );
  let startQuestion = await ask(welcomeMessage);
  while (
    startQuestion.toLowerCase() != "y" &&
    startQuestion.toLowerCase() != "n"
  ) {
    startQuestion = await ask("Are you ready now? (y or n)\n>_");
  }
  if (startQuestion.toLowerCase() === "n") {
    console.log("Oh well, maybe next time.");
    await sleep(3000);
    console.clear();
    start();
  } else {
    console.log("Loading Game...");
    await sleep(3000);
    game();
  }
}

//creating the class for the rooms. the class has name, descriptions, inventory (for the room), and locked status to prevent moving through a locked door.
class Room {
  constructor(name, desc, inv, locked) {
    this.name = name;
    this.description = wrap(desc, 80);
    this.inventory = inv;
    this.locked = locked;
  }
}

//creating the room instances using the room class. inventories are set as an array to allow for multiple items in one room. boolean set for allowing movement through unlocked doors.
let startingAreaMap = new Room(
  "starting area",
  "You wake up outside an old building...\nWhat is going on here???\nOh! I was on a quest to retrieve a sacred family heirloom for some thieves.\nThis must be their lair!",
  [],
  false
);

let lobbyMap = new Room(
  "lobby",
  "The lobby of the thieves lair has a large statue of some old guy in the middle of the lobby.\nThere are hallways extending from the lobby in both directions, east and west.",
  ["statue"],
  false
);

let hallwayEastMap = new Room(
  "east hallway",
  "The eastern hallway is a dark and dusty long hallway with one large door at one end of the hall with a sign that says 'Office' and on the other end of the hall is the lobby.",
  [],
  false
);

let hallwayWestMap = new Room(
  "west hallway",
  "The western hallway is short with a door on the end with a large combination dial in the center. This must be the vault where they are storing the heirloom!\nMaybe I should check it closer…",
  ["vault door"],
  false
);

let officeMap = new Room(
  "office",
  "The room is cramped and musty. There is a table in the middle of the room scattered with papers, maps, and a leather-bound journal. There is a note sticking out the side of the journal…\nhmm should maybe I should check that.",
  ["note"],
  false
);

let vaultMap = new Room(
  "vault",
  "There is a pedestal in the center with a small box. It looks just the right size to hold your cherished family heirloom…",
  ["small box"],
  true
);

//creating and setting the starting/current location of the game.
let currentLocation = startingAreaMap;

//creating the async function to handle player movement between rooms.
async function moveLocation(newLocation) {
  //if statement to determine if the allowed movements variable will allow for the room transition. also, determining if the new room is locked.
  if (
    movements[currentLocation.name].includes(newLocation.name) &&
    newLocation.name == "starting area" &&
    playerInventory.includes(smallBox.name)
  ) {
    console.log(
      wrap(
        `Congratulations! You recovered your family heirloom and made it out of the thieves lair...\nOdd that no one was there...\n`,
        80
      )
    );
    await sleep(5000);
    process.exit();
  } else if (
    movements[currentLocation.name].includes(newLocation.name) &&
    newLocation.locked === false
  ) {
    await sleep(1500);
    console.log(`Moving from ${currentLocation.name} to ${newLocation.name}`);
    //setting the current location to the lookup value of the new desired room.
    currentLocation = locationLookup[newLocation.name];
    // console.log(currentLocation.description);
  } else {
    console.log(
      wrap(
        `You can't move from ${currentLocation.name} to ${newLocation.name}.\nOr maybe you should try interacting with the door...`,
        80
      )
    );
  }
  await sleep(1500);
  game();
}

//creating a location lookup array. the array allows for looking up the room class instance based on the string text.
let locationLookup = {
  "starting area": startingAreaMap,
  lobby: lobbyMap,
  "east hallway": hallwayEastMap,
  "west hallway": hallwayWestMap,
  office: officeMap,
  vault: vaultMap,
};

//creating an allowance array to set what rooms can move to the other rooms.
let movements = {
  "starting area": ["lobby"],
  lobby: ["starting area", "east hallway", "west hallway"],
  "east hallway": ["lobby", "office"],
  "west hallway": ["lobby", "vault"],
  office: ["east hallway"],
  vault: ["west hallway"],
};

//creating a class for items that includes the item name, description, actions, takeability, and the items current location.
class Item {
  constructor(name, description, action, takeable, currentLocationItem) {
    this.name = name;
    this.description = wrap(description, 80);
    this.action = wrap(action, 80) || "Nothing happens";
    //defaulting the takeability to false (ie not takeable)
    this.takeable = takeable || false;
    this.currentLocationItem = currentLocationItem;
  }
  //creating the take method for handling a user picking up an item.
  take() {
    if (this.takeable) {
      //NOTE: instead of pop, use splice and indexof to determine the right spot. this will only work with a singular object in the room.
      playerInventory.push(this.name);
      currentLocation.inventory.pop();
      //setting the items current location to be the player.
      this.currentLocationItem = "player";
      return `You picked up ${this.name}`;
    } else {
      return `You can't take that!`;
    }
  }
  //creating a drop method to allow a player to drop an item. this adds it to the inventory array for the room instance that the player is currently in.
  drop() {
    if (this.takeable) {
      playerInventory.pop();
      currentLocation.inventory.push(this.name);
      this.currentLocationItem = currentLocation;
      return `You dropped ${this.name}`;
    }
  }

  //creating an async method to use an item. some have actions to input that
  async use() {
    //setting the useability and functionality of the statue in the lobby.
    if (this.name == "statue" && currentLocation.name == "lobby") {
      console.log(this.action);
      await sleep(1500);
      let statueQuestion = await ask("Should I push it? enter y or n\n>_");
      while (
        statueQuestion.toLowerCase() != "y" &&
        statueQuestion.toLowerCase() != "n"
      ) {
        statueQuestion = await ask("hmm... y or n?");
      }
      if (statueQuestion === "n") {
        console.log(`You decide to let it be and walk away`);
        return game();
      } else {
        console.log(
          wrap(
            `You decide you like petty vandalism and push the statue over.\nIt topples back and forth a couple of times.\nOne last rock brings it down on your head. Better luck next time.`,
            80
          )
        );
        await sleep(3000);
        process.exit();
      }
      //setting the useability of the vault door to take a combination input.
    } else if (
      this.name == "vault door" &&
      currentLocation.name == "west hallway"
    ) {
      //if combination input incorrectly it will return to the game function.
      let combinationGuess = await ask(`${this.action}\n>_`);
      if (combinationGuess != "3-7-9-3") {
        console.log("Hmm... I guess that was the incorrect code");
        await sleep(1500);
        return game();
      } else {
        //if combination is correct it updates the vaultMap locked to be false (unlocked) so that a user can exit and then re-enter the room without unlocking again.
        vaultMap.locked = false;
        //moving the user into the vault.
        currentLocation = vaultMap;
        console.log(
          wrap(
            "You here the locks tumbling and the door swings open.\nYou enter the vault",
            80
          )
        );
        await sleep(1500);
        return game();
      }
      //catchall to handle other items/objects
    } else {
      console.log(this.action);
      await sleep(1500);
      return game();
    }
  }
}

//creating the items/objects in the game using the item class.
let note = new Item(
  "note",
  "A handwritten note with a combination for the vault",
  "The vault combination is 3-7-9-3 entered exactly like that!",
  true,
  "office"
);

let vaultDoor = new Item(
  "vault door",
  "An intricate vault door with a combination lock",
  "Enter the vault combination!",
  false,
  "west hallway"
);

let statue = new Item(
  "statue",
  "A statue of and old man with a scar across his face",
  "The statue is leaning pretty significantly...\nIt looks like it could topple",
  false,
  "lobby"
);

let smallBox = new Item(
  "small box",
  "A small box that looks the perfect size to hold your family heirloom",
  "Congratulations! You recovered the family heirloom! Now exit the building to win the game.",
  true,
  "vault"
);

//creating the lookup table for the items.
let lookupTable = {
  note: note,
  "vault door": vaultDoor,
  "small box": smallBox,
  statue: statue,
};

//setting the player inventory to start as an empty array.
let playerInventory = [];
let playerStatus = "healthy";
//creating the default player status and inventory
let player = {
  playerInventory: [],
  playerStatus: "healthy",
};
//creating the allowable states of the player status
let playerStatusOptions = {
  healthy: ["unhealthy"],
  unhealthy: ["dead"],
};

let targetRoomAllowList = [
  "starting area",
  "lobby",
  "east hallway",
  "west hallway",
  "vault",
  "office",
];

//creating a single game function to handle the user inputs.
async function game() {
  //Icebox status line with the current locations description, options for movement, and items in the room.
  console.log(
    wrap(
      `Description of Location:\n${
        currentLocation.description
      }\nMovement Options:\n${movements[currentLocation.name]}\nRoom Items:\n${
        currentLocation.inventory
      }`,
      80
    )
  );
  //taking user input and then splitting the action from the target
  let userAction = await ask(">_");
  let inputArray = userAction.toLowerCase().split(" ");
  let action = inputArray[0];
  let target = inputArray.slice(1).join(" ");
  //if statement to open the inventory of the player.
  if (action === "i") {
    console.log(`You are currently carrying:\n${playerInventory}`);
    await sleep(1500);
    return game();
    //if statement for the movement actions. if the input is a valid room it will send it to the movelocation function, if not then it returns that it cannot and restarts the game loop.
  } else if (action === "go") {
    if (
      target === "starting area" ||
      target === "lobby" ||
      target === "east hallway" ||
      target === "west hallway" ||
      target === "vault" ||
      target === "office"
    ) {
      moveLocation(locationLookup[target]);
    } else {
      console.log(`Sorry but I can't ${userAction}`);
      return game();
    }
    //if statement for the action use. uses the current item locations to determine if the player is in the same room or it is in the inventory of the player.
  } else if (action === "use") {
    if (
      lookupTable[target].currentLocationItem == currentLocation.name ||
      lookupTable[target].currentLocationItem == "player"
    ) {
      lookupTable[target].use();
    } else {
      console.log(
        wrap(
          "That is either not a usable item, in the room, or in your inventory",
          80
        )
      );
      await sleep(1500);
      return game();
    }
    //if statement for the action take. allows for taking takeable objects or lets the user know it isn't takeable. Also, catches the user taking an item that is not in the current locations inventory.
  } else if (action === "take") {
    if (currentLocation.inventory.includes(target)) {
      console.log(lookupTable[target].take());
      await sleep(1500);
      return game();
    } else {
      console.log(
        wrap("That is not an item or you are not in the right room", 80)
      );
      await sleep(1500);
      return game();
    }
    //if statement for the drop action. this either allows the player to drop the item into the rooms inventory and removes it from player inventory.
  } else if (action === "drop") {
    if (lookupTable[target] instanceof Item) {
      console.log(lookupTable[target].drop());
      await sleep(1500);
      return game();
    } else {
      console.log(lookupTable[target] instanceof Item);
      console.log("I cannot drop what I don't have");
      await sleep(1500);
      return game();
    }
    //examine action to examine an item.
  } else if (action === "examine") {
    if (currentLocation.inventory.includes(target)) {
      console.log(lookupTable[target].description);
      await sleep(1500);
      return game();
    } else {
      console.log(
        wrap("That is not an item or you are not in the right room", 80)
      );
      await sleep(1500);
      return game();
    }
  } else {
    console.log(`I do not know how to ${userAction}`);
    await sleep(1500);
    return game();
  }
}
