CodeCab
=======

A simple but powerful
[ ![Scratch](https://raw.githubusercontent.com/code-cab/codecab/master/doc-img/scratch-logo2.png) ](https://scratch.mit.edu/)
-like __game engine__
for JavaScript but with physics, auto vectorize, text and graphics.

[CodeCab](https://code.cab) has a quick-start online developer environment for learning JavaScript at
[code.cab/ide.html](https://code.cab/ide.html).

__Contents__
   * [Scratch based API](#scratchapi)
   * [CodeCab features](#features)
      * [Fast graphics](#3fast)
      * [Behaviour controllers](#3controllers)
      * [Physics](#3physics)
      * [Auto vectorize](#3autovectorize)
      * [Graphics](#3graphics)
      * [Text](#3text)
      * [Events](#3events)
      * [Resource loader](#3resourceloader)


<a name="scratchapi"/>
Scratch based API
-----------

When you're familiar with
[ ![Scratch](https://raw.githubusercontent.com/code-cab/codecab/master/doc-img/scratch-logo2.png) ](https://scratch.mit.edu/)
and want to learn JavaScript,
CodeCab is the place to start.

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

Check out [code.cab/ide.html](https://code.cab/ide.html) to learn how to translate
[ ![Scratch](https://raw.githubusercontent.com/code-cab/codecab/master/doc-img/scratch-logo2.png) ](https://scratch.mit.edu/)
blocks to JavaScript code.

<a name="features"/>
CodeCab features
----

<a name="3fast"/>
### Fast graphics

CodeCab makes use of the high performance
[ ![PixiJS](https://raw.githubusercontent.com/code-cab/codecab/master/doc-img/doc-img/pixijs-v4-logo-sml.png) ](http://www.pixijs.com/)
WebGL graphics library.
The integration is transparent to allow direct usage of PIXI.JS when needed.


<a name="3controllers"/>
### Behaviour controllers

Scratch has a lot of logic in one (Sprite) class. To avoid having huge JavaScript classes the logic is spread out
 over multiple _controller_ classes. As shown in the CodeCab example above we have a _CSprite.pen_ for
 the pen logic, _CSprite.sound_ controller for sound and _CSprite.body_ for physics.


<a name="3physics"/>
### Physics

Wouldn't it be fun to have real Physics in Scratch?
[ ![Scratch](https://raw.githubusercontent.com/code-cab/codecab/master/doc-img/scratch-logo2.png) ](https://scratch.mit.edu/)
Gravity, collisions, motors and stuff like that?

It available with CodeCab! Thanks to the fast
[ ![Turbulenz](https://raw.githubusercontent.com/code-cab/codecab/master/doc-img/turbulenz.png) ](http://biz.turbulenz.com/)
physics library.

Just set the Sprite body type to _'dynamic'_ and your sprite will be a fictim of gravity:

```javascript
let stage = new CStage();

let cab = new CSprite('cab.png');
cab.body.type = 'dynamic';
```

The physics world can be configured during creation of the CStage object. The main important options are:

| Option | Description |
| --- | --- |
| gravity | Amount of gravity in m/s. Defaults to _10_. |
| gravityDirection | Direction of the gravity in degrees. Defaults to _180_ which is pointing down. |
| pixelsPerMeter | Indicate how much pixels compares to 1 meter in _Physics world_ coordinates. Default value is _60_ |
| enableDragging | When set to _true_ dynamic objects can be grabbed and dragged by the mouse. Default is _true_. |
| border | Shape of the physical border around the screen. Valid values are _'bottom'_, _'bowl'_ (default), _'box'_ or _'none'_. Alternatively an object can be provided with _left_, _top_, _bottom_, _right_ values. |
| showShapes | Show the vector shapes of physic objects. Can be useful for debugging |
| showConstraints | Show the constraints (like joints and forces) between objects. Can be useful for debugging. |

Example:
```javascript
let stage = new CState({
    gravity: 5,
    pixelsPerMeter: 20,
    enableDragging: false
    border: 'bottom'
});
```

> Implementation note: the Turbulenz library is the fastest around for JavaScript, but sometimes complex shapes may get stuck
with each other. When this is a problem for your project, try using simple shapes like circles instead:
```javascript
let sprite = new CSprite('ball.svg');
sprite.onStart(function() {
   // Create circle shape (note that sprite.width is only valid after the 'start' event.)
   this.setCircleShape(sprite.width / 2);
});
```

#### Physics demo's:
- [Cab Physics Demo](https://code.cab/u/demo/Cab%20Physics%20Demo.html)
- [Mad Parrots](https://code.cab/u/demo/Mad%20Parrots.html)



<a name="3autovectorize"/>
### Auto vectorize

Physics and collision detection in JavaScript is only possible when the (vectorized) shape of an object
is known. CodeCab automatically converts all used __PNG or SVG images with transparent background__ to vector shapes. For that a very fast algorithm is
developed and running in a background worker thread in CodeCab.

You can configure CodeCab to show the rendered shapes:

```javascript
let stage = new CStage({
    showShapes: true
});

let cab = new CSprite('cab.png');
cab.body.type = 'dynamic';
```

CodeCab even allows you to create a new (vectorized) sprite from the pen drawing you
made:
```javascript
let stage = new CStage();
showShapes.showShapes = true;

... // Draw something with sprite.pen

// Create a Sprite from pen!
let penSprite = new CSprite(stage.pen);
penSprite.body.type = 'static';
penSprite.opacity = 0; // Make it invisible since we already have the pen layer
```

#### Vectorize demo:
- [Marbles](https://code.cab/u/demo/Marbles.html)

<a name="3graphics"/>
### Graphics

TODO

<a name="3text"/>
### Text and Google font support

CodeCab has a separate CText class to display multi-line text.

<a name="3events"/>
### Events

CodeCab supports all [PIXI.js events](http://pixijs.download/dev/docs/PIXI.interaction.InteractionManager.html).

#### Start event

The __start__ event is emitted once after startup when all images have been loaded and vectorized.

When a CSprite is created after the first __start__ event has occured, the new CSprite will get a __start__ event as soon as
it's image is available. Therefore the start event is guaranteed to be fired for every CStage, CSprite, CGraphics or CText
object.


#### Mouse/touch events

CodeCab recommends using the _Pointer events_ for handling mouse and touch movements. Although other mouse and touch
events are available (by using the _on('eventname')_ command) direct support is avaiable for:

- onClick(callback)
- onPointerDown(callback)
- onPointerUp(callback)
- onPointerMove(callback)

The callback's first argument is a [PIXI InteractionEvent](http://pixijs.download/dev/docs/PIXI.interaction.InteractionEvent.html)
enriched with extra information:

| Property | Description |
| --- | --- |
| event.point.x <br> event.point.y | Stage coordinates of the event in pixels |
| event.worldPoint.x <br> event.worldPoint.y | Physics coordinates of the event in meters |
| event.data.sprites | Array of sprites related to the event. |

<a name="3resourceloader"/>
### Resource loader

CodeCab makes use of the PIXI resource loader. In the [CodeCab Editor](https://code.cab/ide.html)
the required resources are automatically added to the resource loader and will be available when the _'start'_
event is fired.
When you create your own implementation you can use _CStage.load('myresource.ext')_ to add resources:

```javascript
import {CStage, CSprite} from 'codecab';

let stage = new CStage();

CStage.load('ball.svg');
CStage.load('cat.png');
CStage.load('meow.mp3');

stage.onStart(function() {
    // All resources are available on 'start'
}};
```
