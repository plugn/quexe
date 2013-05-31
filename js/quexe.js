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
    
    conf: {
      maxTicks: 150
    },
    
    data: {
      source: null,
      result: null,
      currentArgs: []
    },
    
    progress: {
      complete: 0,
      tickHead: 0,
      startTime: 0,
      endTime: 0,
      usedTime: 0
    },
    
    run: function(){
      qex.log('run()');
      this.state = 'running';
      if (0 === this.progress.tickHead)
        this.progress.startTime = Date.now();
        
      this.tick();  
    },
    
    stop: function( reason ){
      qex.log('stop( * ' + reason + ' * )');
      this.state = 'stopped';
      var now = Date.now();
      this.progress.endTime = now;
      this.progress.usedTime += now - this.progress.startTime;
    },
    
    tick: function(){
      this.data.currentArgs = [].slice.call(arguments);
      qex.log('tick() #'+this.progress.tickHead+' state: ', this.state); 
      if ('stopped' == this.state){
        qex.log(' * usedTime:'+this.progress.usedTime+'ms');
        return;
      }

      var self = this;
      self.doStep().afterStep();
      setTimeout(curry(self.tick, self), 0);

    },
    
    doStep: function(next){
      return this;
    },
    
    afterStep: function(err, res){
      if (err)
        throw err;
      this.progress.tickHead++;
      
      if (this.progress.tickHead > this.conf.maxTicks)
        this.stop('tick limit reached');
        
      return this;
    }
    
  };
  
  var qex = {
    conf: {
      jobTimeout: 50,
      leapTimeout: 20,
      leapCount: 0,
      maxLeaps: 8
    },
    
    logs: [],
    log: function(){
      var record = [].slice.call(arguments).join('; ');
      qex.logs.push(record);
    },
    echo: function(){
      var dt = new Date(), 
          stamp = (dt.getSeconds()+'.'+dt.getMilliseconds());
      console.log(' * '+ stamp +':\n', qex.logs.join('\n'), '\n=======================================' );
    },  
    
    init: function() {
      this.job = job;
      this.exec('run from init');
    },
    
    exec: function( reason ){
      qex.log(' * qex.exec( *' + reason + '* )  ');
      this.job.run();
      setTimeout(curry(qex.rest, qex), qex.conf.jobTimeout, ['job timeout!']);
    },
    
    rest : function(reason) {
      this.job.stop(reason);
      qex.nextLeap( curry(qex.exec, qex) );
    },
    
    // process.nextTick analogue
    nextLeap: function(callback) {
      qex.log(' * qex.nextLeap() ');
      
      if (++qex.conf.leapCount < qex.conf.maxLeaps)
        setTimeout(callback, qex.conf.leapTimeout, ['nextLeap timeout!']);
      else 
        qex.end();
    },
    end: function() {
      qex.echo();
    }
  }