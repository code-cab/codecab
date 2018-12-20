CodeCab
=======

A powerfull ![Scratch](https://raw.githubusercontent.com/code-cab/codecab/master/doc-img/scratch-logo2.png) like __game engine__ for JavaScript but with physics, autotrace, text and graphics.

[CodeCab](https://code.cab) has a quick start online editor for learning JavaScript at [code.cab/ide.html](https://code.cab/ide.html).


Scratch vs CodeCab
-----------

![Scratch code 1](https://raw.githubusercontent.com/code-cab/codecab/master/doc-img/scratch-code1.png)

```javascript
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


