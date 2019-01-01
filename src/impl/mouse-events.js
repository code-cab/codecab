

const MOUSE_EVENTS = ['click',
    'mousedown', 'mousemove', 'mouseout', 'mouseover', 'mouseup', 'mouseupoutside',
    'pointercancel', 'pointerdown', 'pointermove', 'pointerout', 'pointerover', 'pointertap', 'pointerup', 'pointerupoutside',
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
    console.log(eventName);
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
        let handled = false;
        for (let j = 0; target._eventMap[eventName] && j < target._eventMap[eventName].length; j += 1) {
            let callback = target._eventMap[eventName][j];
            callback.call(target, event);
            handled = true;
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

