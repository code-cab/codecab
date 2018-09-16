
https://github.com/turbulenz/turbulenz_engine/issues/51

Look for the code applying : Event listeners on shapeB

line 11210 : cb.thisObject = shapeA;

need to be replaced by cb.thisObject = shapeB;

Otherwise the shape A will register callback to itself many times.

---

