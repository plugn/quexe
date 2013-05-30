  // dependency: ctor.js
  function clone(o){
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
  }
  
  // Function.bind() aka Currying micro implementaion
  function curry(fn, context){
    var args = [].slice.call(arguments, 2);
    return function(){
      fn.apply(context, args.concat([].slice.call(arguments)))
    };
  }  

  
  var job = {

    state: 'defined',
    
    data: {
      source: null,
      result: null,
      currentArgs: []
    },
    
    progress: {
      complete: 0,
      tickHead: 0,
      startTime: 0,
      tickStartTime: 0,
      endTime: 0,
      usedTime: 0
    },
    
    conf: {
      timeout: 100
    },
    
    init: function(job){
      console.log('job.init()');  
      this.state = 'initialized';
    },
    
    stop: function(){
      this.state = 'stopped';
    },
    
    tick: function(){
      this.data.currentArgs = [].slice.call(arguments);
/*      
      this.beforeStep(
          this.doStep(
            this.afterStep
          )
      );
*/      
      this.beforeStep();

    },
    
    beforeStep: function(next) {
      if ('stopped' == this.state){
        console.log('beforeStep() :' + this.state);
        return;
      }  
        
      this.state = 'running';
      
      this.progress.tickStartTime = Date.now();
      
      if (0 === this.progress.tickHead)
        this.progress.startTime = this.progress.tickStartTime;
        
      console.log('beforeStep() #state:', this.state, ' @ tick #', this.progress.tickHead);
        
      // next();  
      this.doStep();
    },
    
    doStep: function(next){
      console.log('doStep() processing #' + this.progress.tickHead);
      
      var err = null, 
          res = { ok : true };
          
      // next(err, res);
      this.afterStep();
    },
    
    afterStep: function(err, res){
      if (err)
        throw err;
      this.progress.tickHead++;
      
      var now = Date.now();
      this.progress.endTime = now;
      this.progress.usedTime += now - this.progress.tickStartTime;
      
      console.log('afterStep() #state:', this.state, ' @ tick #', this.progress.tickHead);
      
      // dirty
      this.loopback();
    },
    
    loopback: function() {
      if (this.progress.tickHead > 25000)
        this.stop();
        
      this.tick();  
    }
    
  };
  
  function fnx(){ 
    this.tick.apply(this, [].slice.call(arguments)); 
  }    
  
  var app = {
    init: function() {
      console.log(' * app.init() ');
      
      // var fn = self.fn = $fxt( job );
      var fn = self.fn = curry(fnx, job);
      
      fn();
      var tm = setTimeout(fn, 100);
      
    }
  }
