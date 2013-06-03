// @title ctor.js
// @description Advanced Classic OOP for JavaScript
// @author Max L Dolgov bananafishbone at gmail dot com

(function() {
  // root object, 'window' in the browser, or 'global' on the server.
  var root = this;
  
  function isArray(o) { 
    return o instanceof Array || {}.toString.call(o) === '[object Array]';
  }  
  function grow(member) {
    return 'function' == typeof member? ctor.spawn(member) : ctor.clone(member);
  }  

  var ctor = {
  
    clone: function(o){
      var cloned;
      if ('object' == typeof o) {
        if (isArray(o)){
          cloned = [];
          for (var i = 0, l = o.length; i < l; i++) cloned[i] = ctor.clone(o[i]);
        } else { 
          cloned = {};
          for (var p in o) cloned[p] = ctor.clone(o[p]);
        }
      } else return o;
      return cloned;
    },    
    
    //  OOP Object Factory instantiates an object with own properties cloned from a prototype
    //  var o = ctor.spawn( (Function) constructor, (Array) arguments )
    spawn: function( konstr, args ) {
      if ('function' != typeof konstr)
        throw new Error('ctor.spawn() : konstr is not a Function');
      function fn(){};
      var instance = new fn();
      konstr.apply( instance, [].concat(args) );
      for (var prop in konstr.prototype)
        instance[ prop ] = ctor.clone( konstr.prototype[prop] );
      return instance;
    },
    
    // Classic OOP inheritance 
    // instance has a '$parent' key representing superclass with its methods
    // var o = ctor.inherit((Function or Object) [TopClass, ..] MidClass, BaseClass);
    inherit: function() {
      var args = [].slice.call(arguments);
      if (args.length < 2) return false;
      if (args.length > 2) {
        for (var idx = args.length - 2, obj = args[idx + 1]; idx > -1; idx--)
          obj = arguments.callee(args[idx], obj);
        return obj;
      } else {
        var instance = grow(args[0]),
            parent   = grow(args[1]);
        for (var k in parent) {
          if ('$parent'==k || 'undefined'==typeof parent[k])
            continue;
          if (typeof instance[k] == 'undefined')
            instance[k] =  ctor.clone(parent[k]);
          if (typeof parent[k] != 'function') 
            delete parent[k];
        }
        instance.$parent = parent;
        return instance;
      }
    },
    /*
        tries to get deep nested property of passed object, 
        if found returns it, else returns `def` argument
        
        getNested('p.a.t.h', '*', {p:{a:{t:{h:[1],i:[2]}}}} )
        [1]
        getNested.call({p:{a:{t:{h:[1],i:[2]}}}}, 'p.a.t.i', '*' )
        [2]
        ('p.a.t.y', '*', {p:{a:{t:{h:[1],i:[2]}}}} )
        "*"
    */
    getNested: function(path, def, root){
      var key, val = !!root? root : this, arr = String(path).split('.');
      while ((key = arr.shift()) && 'object' == typeof val && val) {
        val = 'undefined' == typeof val[key]? ('undefined' == typeof def? false : def) : val[key];
      }
      return val;  
    },
      
    // Function.bind() aka Currying micro implementaion
    curry: function(fn, context){
      var args = [].slice.call(arguments, 2);
      return function(){ 
        fn.apply(context, args.concat([].slice.call(arguments))) 
      };
    }    
  }
  
  root.ctor = ctor;

}).call(this);
