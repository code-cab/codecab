function firstDefined(val0, val1) {
    if (typeof val0 !== 'undefined') {
        return val0;
    }
    return val1;
}

function capture(reg, s) {
    var captures = [];
    var result;
    while (result = reg.exec(s)) {
        captures.push(result[0]);
    }
    return captures;
}


function startWith(str, prefix) {
    if (!str || str.length < prefix.length)
        return false;
    for (var i = prefix.length - 1; (i >= 0) && (str[i] === prefix[i]); --i)
        continue;
    return i < 0;
}

function regExPEscape(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}


class ValidationError extends Error {}

var ASSERT = {
    message: null,
    debug: false,
    error: function(msg) {
        if (!ASSERT.debug) return;
        throw new Error(msg);
    },
    validationError: function(msg) {
        if (!ASSERT.debug) return;
        throw new ValidationError(msg);
    },
    isString: function (value, name) {
        if (!ASSERT.debug) return;
        ASSERT.isTypeOf('String', value, name);
    },
    isNumber: function (value, name) {
        if (!ASSERT.debug) return;
        ASSERT.isTypeOf('Number', value, name);
    },
    isFunction: function (value, name) {
        if (!ASSERT.debug) return;
        ASSERT.isTypeOf('Function', value, name);
    },
    isObject: function (value, name) {
        if (!ASSERT.debug) return;
        ASSERT.isTypeOf('Object', value, name);
    },
    isInstanceOf: function (instance, value, name) {
        if (!ASSERT.debug) return;
        if (!(value instanceof instance)) {
            ASSERT.validationError(name
                ? "Argument '" + name + "' must be instance of '" + instance + "'"
                : "Instance of '" + instance + "' argument expected");
        }
    },
    isTypeOf: function(type, value, name) {
        if (!ASSERT.debug) return;
        if (typeof value !== type.toLowerCase()) {
            ASSERT.validationError(name
                ? "Argument '" + name + "' must be of type '" + type + "'. Value is:" + value
                : "Type '" + type + "' argument expected. Value is: " + value);
        }
    },
    isOneOf: function(allowedValues, value, name) {
        if (!ASSERT.debug) return;
        if (allowedValues.indexOf(value) < 0) {
            ASSERT.validationError("Argument '" + name + "' must be one of: " + allowedValues.join(', '));
        }
    }
};

var UTIL= {
    set_property: function (proto, name, def)
    {
        var d = def;
        if (!d.set) {
            d.set = function () {
                throw new Error("Property '" + name + "' cannot be set");
            };
        }
        if (!d.get) {
            d.get = function () {
                throw new Error("Property '" + name + "' cannot be read");
            };
        }
        Object.defineProperty(proto, name, d);
    }
};

export {firstDefined, startWith, regExPEscape, ASSERT, UTIL};