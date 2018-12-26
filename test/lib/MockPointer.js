'use strict';

require('./testutil');

/**
 * Use this to mock mouse/touch/pointer events
 *
 * @class
 */
class MockPointer
{
    /**
     */
    constructor()
    {
        this.activeTouches = [];
        this.interaction = CStage.get()._app.renderer.plugins.interaction;
    }

    /**
     * Cleans up after tests
     */
    cleanup()
    {
    }

    /**
     * @private
     * @param {number} x - pointer x position
     * @param {number} y - pointer y position
     */
    setPosition(x, y)
    {
        this.interaction.mapPositionToPoint = (point) =>
        {
            point.x = x;
            point.y = y;
        };
    }


    /**
     * [createEvent description]
     * @param  {string} eventType  `type` of event
     * @param  {number} x          pointer x position
     * @param  {number} y          pointer y position
     * @param  {number} [identifier] pointer id for touch events
     * @param  {boolean} [asPointer]  If it should be a PointerEvent from a mouse or touch
     * @param  {boolean} [onCanvas=true] If the event should be on the canvas (as opposed to a different element)
     * @return {Event} Generated MouseEvent, TouchEvent, or PointerEvent
     */
    createEvent(eventType, x, y, identifier, asPointer, onCanvas = true)
    {
        let event;
        let view = CStage.get()._app.view;

        if (eventType.startsWith('mouse'))
        {
            if (asPointer)
            {
                event = new PointerEvent(eventType.replace('mouse', 'pointer'), {
                    pointerType: 'mouse',
                    clientX: x,
                    clientY: y,
                    preventDefault: sinon.stub(),
                });
            }
            else
            {
                event = new MouseEvent(eventType, {
                    clientX: x,
                    clientY: y,
                    preventDefault: sinon.stub(),
                });
            }
            if (onCanvas)
            {
                Object.defineProperty(event, 'target', { value: view });
            }
        }
        else if (eventType.startsWith('touch'))
        {
            if (asPointer)
            {
                eventType = eventType.replace('touch', 'pointer').replace('start', 'down').replace('end', 'up');
                event = new PointerEvent(eventType, {
                    pointerType: 'touch',
                    pointerId: identifier || 0,
                    clientX: x,
                    clientY: y,
                    preventDefault: sinon.stub(),
                });
                Object.defineProperty(event, 'target', { value: view });
            }
            else
            {
                const touch = new Touch({ identifier: identifier || 0, target: view });

                if (eventType.endsWith('start'))
                {
                    this.activeTouches.push(touch);
                }
                else if (eventType.endsWith('end') || eventType.endsWith('leave'))
                {
                    for (let i = 0; i < this.activeTouches.length; ++i)
                    {
                        if (this.activeTouches[i].identifier === touch.identifier)
                        {
                            this.activeTouches.splice(i, 1);
                            break;
                        }
                    }
                }
                event = new TouchEvent(eventType, {
                    preventDefault: sinon.stub(),
                    changedTouches: [touch],
                    touches: this.activeTouches,
                });

                Object.defineProperty(event, 'target', { value: view });
            }
        }
        else
        {
            event = new PointerEvent(eventType, {
                pointerType: 'pen',
                pointerId: identifier || 0,
                clientX: x,
                clientY: y,
                preventDefault: sinon.stub(),
            });
            Object.defineProperty(event, 'target', { value: view });
        }

        this.setPosition(x, y);
        // this.render();

        return event;
    }

    /**
     * @param {number} x - pointer x position
     * @param {number} y - pointer y position
     * @param {boolean} [asPointer] - if it should be a PointerEvent from a mouse
     */
    mousemove(x, y, asPointer)
    {
        const stage = CStage.get();
        // mouseOverRenderer state should be correct, so mouse position to view rect
        const rect = new PIXI.Rectangle(0, 0, stage.width, stage.height);

        if (rect.contains(x, y))
        {
            if (!this.interaction.mouseOverRenderer)
            {
                this.interaction.onPointerOver(this.createEvent('mouseover', x, y, null, asPointer));
            }
            this.interaction.onPointerMove(this.createEvent('mousemove', x, y, null, asPointer));
        }
        else
        {
            this.interaction.onPointerOut(this.createEvent('mouseout', x, y, null, asPointer));
        }
    }

    /**
     * @param {number} x - pointer x position
     * @param {number} y - pointer y position
     * @param {boolean} [asPointer] - if it should be a PointerEvent from a mouse
     */
    click(x, y, asPointer)
    {
        this.mousedown(x, y, asPointer);
        this.mouseup(x, y, asPointer);
    }

    /**
     * @param {number} x - pointer x position
     * @param {number} y - pointer y position
     * @param {boolean} [asPointer] - if it should be a PointerEvent from a mouse
     */
    mousedown(x, y, asPointer)
    {
        this.interaction.onPointerDown(this.createEvent('mousedown', x, y, null, asPointer));
    }

    /**
     * @param {number} x - pointer x position
     * @param {number} y - pointer y position
     * @param {boolean} [onCanvas=true] - if the event happend on the Canvas element or not
     * @param {boolean} [asPointer] - if it should be a PointerEvent from a mouse
     */
    mouseup(x, y, onCanvas = true, asPointer = false)
    {
        this.interaction.onPointerUp(this.createEvent('mouseup', x, y, null, asPointer, onCanvas));
    }

    /**
     * @param {number} x - pointer x position
     * @param {number} y - pointer y position
     * @param {number} [identifier] - pointer id
     * @param {boolean} [asPointer] - if it should be a PointerEvent from a touch
     */
    tap(x, y, identifier, asPointer)
    {
        this.touchstart(x, y, identifier, asPointer);
        this.touchend(x, y, identifier, asPointer);
    }

    /**
     * @param {number} x - pointer x position
     * @param {number} y - pointer y position
     * @param {number} [identifier] - pointer id
     * @param {boolean} [asPointer] - if it should be a PointerEvent from a touch
     */
    touchstart(x, y, identifier, asPointer)
    {
        this.interaction.onPointerDown(this.createEvent('touchstart', x, y, identifier, asPointer));
    }

    /**
     * @param {number} x - pointer x position
     * @param {number} y - pointer y position
     * @param {number} [identifier] - pointer id
     * @param {boolean} [asPointer] - if it should be a PointerEvent from a touch
     */
    touchmove(x, y, identifier, asPointer)
    {
        this.interaction.onPointerMove(this.createEvent('touchmove', x, y, identifier, asPointer));
    }

    /**
     * @param {number} x - pointer x position
     * @param {number} y - pointer y position
     * @param {number} [identifier] - pointer id
     * @param {boolean} [asPointer] - if it should be a PointerEvent from a touch
     */
    touchend(x, y, identifier, asPointer)
    {
        this.interaction.onPointerUp(this.createEvent('touchend', x, y, identifier, asPointer));
    }

    /**
     * @param {number} x - pointer x position
     * @param {number} y - pointer y position
     * @param {number} [identifier] - pointer id
     * @param {boolean} [asPointer] - if it should be a PointerEvent from a touch
     */
    touchleave(x, y, identifier, asPointer)
    {
        this.interaction.onPointerOut(this.createEvent('touchleave', x, y, identifier, asPointer));
    }

    /**
     * @param {number} x - pointer x position
     * @param {number} y - pointer y position
     * @param {number} [identifier] - pointer id
     */
    pendown(x, y, identifier)
    {
        this.interaction.onPointerDown(this.createEvent('pointerdown', x, y, identifier, true));
    }

    /**
     * @param {number} x - pointer x position
     * @param {number} y - pointer y position
     * @param {number} [identifier] - pointer id
     */
    penmove(x, y, identifier)
    {
        this.interaction.onPointerMove(this.createEvent('pointermove', x, y, identifier, true));
    }

    /**
     * @param {number} x - pointer x position
     * @param {number} y - pointer y position
     * @param {number} [identifier] - pointer id
     */
    penup(x, y, identifier)
    {
        this.interaction.onPointerUp(this.createEvent('pointerup', x, y, identifier, true));
    }
}

module.exports = MockPointer;