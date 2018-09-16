//import * as PIXI from '../../lib/es6/pixi.js/index';
import * as PIXI from 'pixi.js';

export function fixPixi() {
    /**
     * Check additional _eventMap to avoid unnecessary expensive hit tests
     */
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
        else if (hitTest && displayObject._mask)
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

            // ADDED extra _eventMap mapping
            if ((!displayObject._eventMap || displayObject._eventMap[interactionEvent.data.originalEvent.type]) &&
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
}
