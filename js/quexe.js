  
  var qexJob = {

    state: 'defined', // defined|running|stopped|complete
    
    conf: {
      maxTicks: 75,
      states: {
        running:  {},
        stopped:  { milestone: true },
        complete: { milestone: true }
      }  
    },
    
    data: {
      source: null,
      result: null,
      currentArgs: []
    },
    
    progress: {
      tickHead: 0,
      startTime: 0,
      endTime: 0,
      usedTime: 0
    },
    
    runnable: function() {
      return 'complete' !== this.state;
      // return (-1 === ['complete','running'].indexOf(this.state));
    },
    
    run: function(){
      qex.log('run() state:'+this.state);
      if (!this.runnable()) 
        return;
      this.state = 'running';
      if (0 === this.progress.tickHead)
        this.progress.startTime = Date.now();
        
      this.tick();  
    },
    
    stop: function( reason ){
      return this.setState('stopped', reason);
    },

    complete: function( reason ) {
      return this.setState('complete', reason);
    },
    
    setState: function( state, reason ) {
      qex.log('setState( "' + state + '" over "'+this.state+'", *' + reason + '* )');
      if (!(state in this.conf.states) || ('complete' === this.state && 'stopped' === state))
        return;      
        
      this.state = state;
      var stConf = this.conf.states[ state ];
      if (stConf && stConf.milestone) {
        var now = Date.now();
        this.progress.endTime = now;
        this.progress.usedTime += now - this.progress.startTime;
      }
    },
    
    tick: function(){
      this.data.currentArgs = [].slice.call(arguments);
      qex.log('tick() #'+this.progress.tickHead+' state: ', this.state); 
      if (-1 < ['stopped', 'complete'].indexOf(this.state)){
        qex.log(' * usedTime:'+this.progress.usedTime+'ms');
        return;
      }

      var self = this;
      self.doStep().afterStep();
      setTimeout(ctor.curry(self.tick, self), 0);

    },
    
    doStep: function(next){
      return this;
    },
    
    afterStep: function(err, res){
      if (err)
        throw err;
      this.progress.tickHead++;
      
      if (this.progress.tickHead > this.conf.maxTicks)
        this.complete('maxTicks amount reached');
        
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
          stamp = (dt.getMinutes()+':'+dt.getSeconds()+'.'+dt.getMilliseconds());
      console.log(' * ['+ stamp +']', '\n'+qex.logs.join('\n')+'\n', '=======================================' );
    },  
    
    init: function() {
      this.job = ctor.clone(qexJob);
      this.exec('run from init');
    },
    
    exec: function( reason ){
      qex.log(' * qex.exec( *' + reason + '* )  ');
      if (this.job.runnable()) {
        this.job.run();
        setTimeout(ctor.curry(qex.rest, qex), qex.conf.jobTimeout, ['job timeout!']);
      } else {
        qex.end('exec() job is not runnable');
      }
    },
    
    rest : function(reason) {
      this.job.stop(reason);
      qex.nextLeap(ctor.curry(qex.exec, qex));
    },
    
    // process.nextTick analogue
    nextLeap: function(callback) {
      qex.log(' * qex.nextLeap( '+(1+qex.conf.leapCount)+' / '+qex.conf.maxLeaps+' ) ');
      
      if (++qex.conf.leapCount < qex.conf.maxLeaps)
        setTimeout(callback, qex.conf.leapTimeout, ['nextLeap timeout!']);
      else 
        qex.end('maxLeaps amount reached');
    },
    
    end: function( reason ) {
      qex.log('qex.end( * ' +  reason + ' * )');
      qex.log(' * usedTime:'+this.job.progress.usedTime+'ms');
      
      qex.echo();
    }
  }