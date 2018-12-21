CodeCab
=======

![Scratch](https://raw.githubusercontent.com/code-cab/codecab/master/doc-img/cc-logo.png)  is a  powerfull ![Scratch](https://raw.githubusercontent.com/code-cab/codecab/master/doc-img/scratch-logo2.png) like __game engine__ for JavaScript but with physics, autotrace, text and graphics.


[CodeCab](https://code.cab) has a quick start online editor for learning JavaScript at [code.cab/ide.html](https://code.cab/ide.html).


Scratch vs CodeCab
-----------

![Scratch code 1](https://raw.githubusercontent.com/code-cab/codecab/master/doc-img/scratch-code1.png)

CodeCab equivalent:
```javascript
import {CStage, CSprite} from 'codecab';

let stage = new CStage();

let cat = new CSprite('cat.png');

cat.onStart(async function() {
    this.pen.down();
    for (let count = 0; count < 10; count += 1) {
        this.move(10);
        await this.say("CodeCab", 2);
        await this.sound.play('meow.mp3');
        this.turn(15);
    }
});
```

Check out [code.cab/ide.html](https://code.cab/ide.html) for more information how to move from ![Scratch](https://raw.githubusercontent.com/code-cab/codecab/master/doc-img/scratch-logo2.png) to JavaScript CodeCab.

CodeCab features
----

### Behaviour controllers

![Scratch](https://raw.githubusercontent.com/code-cab/codecab/master/doc-img/scratch-logo2.png)
has a lot of logic in one (Sprite) class. To avoid having huge classes the logic is devided
 over multiple _controllers_. As shown in the CodeCab example above we have a _CSprite.pen_ for
 the pen logic and a _Sprite.sound_ controller for sound.


### Physics

Wouldn't it be fun to have real Physics in ![Scratch](https://raw.githubusercontent.com/code-cab/codecab/master/doc-img/scratch-logo2.png)? Gravity, collisions, motors and stuff like that.

CodeCab has it all!

Just use the _CSprite.body_ controller to make your sprite have gravity like this:

```javascript
let cab = new CSprite('cab.png');
cab.body.type = 'dynamic';
```

In the CStage class, the conroller is named _CStage.physics_
#### Demo's:
- [Cab Physics Demo](https://code.cab/u/demo/Cab%20Physics%20Demo.html)
- [Mad Parrots](https://code.cab/u/demo/Mad%20Parrots.html)

### Autovectorize

Physics and collision detection in JavaScript is only possible when the (vectorized) shape of an object
is known. CodeCab automatically converts all used images to vector shapes. For that a very fast algorithm is
developed and running in a background worker thread in CodeCab.

You can configure CodeCab to show the rendered shapes:

```javascript
let stage = new CStage({
    showShapes: true
});

let cab = new CSprite('cab.png');
cab.body.type = 'dynamic';
```

CodeCab has a nice feature that allows a _pen_ drawing to be converted to a new CSprite with a vectorized shape:
```javascript
let stage = new CStage();
showShapes.showShapes = true;

// Draw something with sprite.pen

// Create a Sprite from pen!
let penSprite = new CSprite(stage.pen);
penSprite.body.type = 'static';
penSprite.opacity = 0; // Hide it since we already have the pen layer
```


#### Demo's:
- [Marbles](https://code.cab/u/demo/Marbles.html)


