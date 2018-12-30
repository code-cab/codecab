

const MOUSE_EVENTS = ['click',
    'mousedown', 'mousemove', 'mouseout', 'mouseover', 'mouseup', 'mouseupoutside',
    'pointercancel', 'pointerdown', 'pointermove', 'pointerout', 'pointerover', 'pointertab', 'pointerup', 'pointerupoutside',
    'rightclick', 'rightdown', 'rightup', 'rightupoutside',
    'tab', 'touchcancel', 'touchend', 'touchendoutside', 'touchmove', 'touchstart'
];

let registeredEventMap = {};
let stage;
// let eventMap = {};

export {
    setStage,
    isMouseEvent,
    // bindMouseEvent,
    // unbindMouseEvent,
    registerMouseEvent,
    unregisterMouseEvent,
    destroy
}

function setStage(_stage) {
    stage = _stage;
}

function isMouseEvent(eventName) {
    return MOUSE_EVENTS.indexOf(eventName) >= 0;
}

// function bindMouseEvent(eventName, callback) {
//     if (eventMap[eventName] === undefined) {
//         eventMap[eventName] = [];
//     }
//     eventMap[eventName].push(callback);
//     registerMouseEvent.call(this, eventName);
// }
//
// function unbindMouseEvent(eventName, callback) {
//     if (eventMap[eventName]) {
//         let i = eventMap[eventName].indexOf(callback);
//         if (i >= 0) eventMap[eventName].splice(i, 1);
//         if (!eventMap[eventName].length) {
//             delete eventMap[eventName];
//         }
//     }
//     unregisterMouseEvent.call(this, eventName, callback);
// }


function registerMouseEvent(eventName) {
    if (registeredEventMap[eventName] === undefined) {
        stage._app.stage.interactive = true;
        stage._app.stage.interactiveChildren = false;
        if (!stage._app.stage.hitArea) {
            stage._app.stage.hitArea = new PIXI.Rectangle(0, 0, stage.width, stage.height);
        }
        registeredEventMap[eventName] = 1;
        stage._app.stage.on(eventName,
            event => handleEvent.call(this, event, eventName));
    } else {
        registeredEventMap[eventName] += 1;
    }
}

function unregisterMouseEvent(eventName) {
    if (registeredEventMap[eventName] > 0) {
        registeredEventMap[eventName] -= 1;
        if (registeredEventMap[eventName] <= 0) {
            delete registeredEventMap[eventName];
            stage._app.stage.removeListener(eventName);
        }
    }
}

function destroy() {
    for (let eventName of registeredEventMap) {
        stage._app.stage.removeListener(eventName);
    }
    registeredEventMap = {};
}

function isPropagationStopped(event) {
    return event.data.originalEvent.cancelBubble;
}

function handleEvent(event, eventName) {
    if (!stage._running) return;
    let point = stage._stageContainer.toLocal(event.data.global);
    event.point = point;
    point = [
        point.x / stage.options.pixelsPerMeter,
        point.y / stage.options.pixelsPerMeter];
    event.worldPoint = {
        x: point[0],
        y: point[1]
    };

    event.stopPropagation = () => event.data.originalEvent.stopPropagation();

    let bodies = [];
    stage._physics.world.bodyPointQuery(point, bodies);

    let targets = [];
    hitTest(event.data.global, stage._app.stage, eventName, bodies, targets);

    // Strip CStage object from targets
    event.allTargets = targets.filter(t => t !== stage);

    for (let i = 0; i < targets.length && !isPropagationStopped(event); i += 1) {
        let target = targets[i];
        for (let j = 0; target._eventMap[eventName] && j < target._eventMap[eventName].length; j += 1) {
            let callback = target._eventMap[eventName][j];
            callback.call(target, event);
            if (stage.options.autoStopPropagation) {
                event.stopPropagation();
            }
            if (isPropagationStopped(event)) break;
        }
    }
}

let tempPoint = new PIXI.Point();

function isInChildrenContainer(ccObject) {
    let o = ccObject.parent;
    while (o) {
        if (o === stage._childrenContainer) return true;
        o = o.parent;
    }
    return false;
}

function hitTest(globalPoint, displayObject, eventName, bodies, hitTargets) {
    const children = displayObject.children;
    let childHit = false;
    for (let i = children.length - 1; i >= 0; i -= 1) {
        const child = children[i];
        if (hitTest(globalPoint, child, eventName, bodies, hitTargets)) {
            childHit = true;
        }
    }

    let hit = false;

    let ccObject = displayObject._childObject || displayObject._stageObject;

    if (ccObject) {
        if (isInChildrenContainer(ccObject) && ccObject.body) {
            if (!ccObject.body.isNone() && bodies.indexOf(ccObject.body._rigidBody) >= 0) {
                hit = true;
            }
        } else {
            if (displayObject.hitArea)
            {
                displayObject.worldTransform.applyInverse(globalPoint, tempPoint);
                if (displayObject.hitArea.contains(tempPoint.x, tempPoint.y))
                {
                    hit = true;
                }
            }
            else if (displayObject.containsPoint)
            {
                if (displayObject.containsPoint(globalPoint))
                {
                    hit = true;
                }
            }
        }
        if (hit || childHit) {
            hitTargets.push(ccObject);
            return true;
        }
    }


    return false;
}

/**
 *
 * Override PIXI Interaction manager to:
 * - Check additional _eventMap to avoid unnecessary expensive hit tests
 * - Ignore objects with a body
 */
/*
PIXI.interaction.InteractionManager.prototype.processInteractive = function(interactionEvent, displayObject, func, hitTest, interactive) {
    if (!displayObject || !displayObject.visible)
    {
        return false;
    }

    const point = interactionEvent.data.global;

    // Took a little while to rework this function correctly! But now it is done and nice and optimised. ^_^
    //
    // This function will now loop through all objects and then only hit test the objects it HAS
    // to, not all of them. MUCH faster..
    // An object will be hit test if the following is true:
    //
    // 1: It is interactive.
    // 2: It belongs to a parent that is interactive AND one of the parents children have not already been hit.
    //
    // As another little optimisation once an interactive object has been hit we can carry on
    // through the scenegraph, but we know that there will be no more hits! So we can avoid extra hit tests
    // A final optimisation is that an object is not hit test directly if a child has already been hit.

    interactive = displayObject.interactive || interactive;

    let hit = false;
    let interactiveParent = interactive;

    // if the displayobject has a hitArea, then it does not need to hitTest children.
    if (displayObject.hitArea)
    {
        interactiveParent = false;
    }
    // it has a mask! Then lets hit test that before continuing
    else if (hitTest && displayObject._mask && !displayObject.body)
    {
        if (!displayObject._mask.containsPoint(point))
        {
            hitTest = false;
        }
    }

    // ** FREE TIP **! If an object is not interactive or has no buttons in it
    // (such as a game scene!) set interactiveChildren to false for that displayObject.
    // This will allow PixiJS to completely ignore and bypass checking the displayObjects children.
    if (displayObject.interactiveChildren && displayObject.children)
    {
        const children = displayObject.children;

        for (let i = children.length - 1; i >= 0; i--)
        {
            const child = children[i];

            // time to get recursive.. if this function will return if something is hit..
            const childHit = this.processInteractive(interactionEvent, child, func, hitTest, interactiveParent);

            if (childHit)
            {
                // its a good idea to check if a child has lost its parent.
                // this means it has been removed whilst looping so its best
                if (!child.parent)
                {
                    continue;
                }

                // we no longer need to hit test any more objects in this container as we we
                // now know the parent has been hit
                interactiveParent = false;

                // If the child is interactive , that means that the object hit was actually
                // interactive and not just the child of an interactive object.
                // This means we no longer need to hit test anything else. We still need to run
                // through all objects, but we don't need to perform any hit tests.

                if (childHit)
                {
                    if (interactionEvent.target)
                    {
                        hitTest = false;
                    }
                    hit = true;
                }
            }
        }
    }

    // no point running this if the item is not interactive or does not have an interactive parent.
    if (interactive)
    {
        // if we are hit testing (as in we have no hit any objects yet)
        // We also don't need to worry about hit testing if once of the displayObjects children
        // has already been hit - but only if it was interactive, otherwise we need to keep
        // looking for an interactive child, just in case we hit one

        // ADDED extra _eventMap mapping and ignore when body
        if (displayObject._eventMap &&
            displayObject._eventMap[interactionEvent.data.originalEvent.type] &&
            !displayObject.body &&
            hitTest && !interactionEvent.target)
        {
            if (displayObject.hitArea)
            {
                displayObject.worldTransform.applyInverse(point, this._tempPoint);
                if (displayObject.hitArea.contains(this._tempPoint.x, this._tempPoint.y))
                {
                    hit = true;
                }
            }
            else if (displayObject.containsPoint)
            {
                if (displayObject.containsPoint(point))
                {
                    hit = true;
                }
            }
        }

        if (displayObject.interactive)
        {
            if (hit && !interactionEvent.target)
            {
                interactionEvent.target = displayObject;
            }

            if (func)
            {
                func(interactionEvent, displayObject, !!hit);
            }
        }
    }

    return hit;

};
*/