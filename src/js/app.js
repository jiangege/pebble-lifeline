var Bus, UI, Settings, Component, NearLinesWin, StationDetailWin, BusesDetailWin, AlertWin, BusUI;
Bus = require('bus');
UI = require('ui');
Settings = require('settings');
Component = (function(){
  Component.displayName = 'Component';
  var prototype = Component.prototype, constructor = Component;
  prototype.updateInv = 1000 * 10;
  prototype._updateInv = null;
  prototype.show = function(params){
    this.params = params != null
      ? params
      : {};
    return this.win.show();
  };
  prototype.hide = function(){
    return this.win.hide();
  };
  prototype.loaderrorCallback = function(){};
  prototype.onloaderror = function(cb){
    return this.loaderrorCallback = cb;
  };
  prototype.runUpdateTimer = function(){
    var this$ = this;
    this.stopUpdateTimer();
    return this._updateInv = setInterval(function(){
      return this$.load(function(){
        return this$.update();
      }, false);
    }, this.updateInv);
  };
  prototype.stopUpdateTimer = function(){
    return clearInterval(this._updateInv);
  };
  function Component(){}
  return Component;
}());
NearLinesWin = (function(superclass){
  var prototype = extend$((import$(NearLinesWin, superclass).displayName = 'NearLinesWin', NearLinesWin), superclass).prototype, constructor = NearLinesWin;
  function NearLinesWin(){
    var this$ = this;
    this.win = new UI.Menu({
      backgroundColor: 'white',
      textColor: 'black',
      highlightBackgroundColor: 'black',
      highlightTextColor: 'white'
    });
    this.win.on('select', function(e){
      if (this$.data != null) {
        return this$.selectCallback(this$.data[e.sectionIndex]);
      }
    });
    this.win.on('show', function(e){
      return this$.load(function(){
        return this$.update();
      });
    });
  }
  prototype.load = function(cb){
    var this$ = this;
    return Bus.getNearLines(function(err, lines){
      if (err) {
        return this$.loaderrorCallback(err);
      }
      this$.data = lines;
      return cb();
    });
  };
  prototype.update = function(){
    var sections, res$, i$, ref$, len$, i, line;
    res$ = [];
    for (i$ = 0, len$ = (ref$ = this.data).length; i$ < len$; ++i$) {
      i = i$;
      line = ref$[i$];
      res$.push({
        title: "distance / " + line.distance + "m",
        items: [{
          title: line.sn
        }]
      });
    }
    sections = res$;
    return this.win.sections(sections);
  };
  prototype.selectCallback = function(){};
  prototype.onselect = function(cb){
    return this.selectCallback = cb;
  };
  return NearLinesWin;
}(Component));
StationDetailWin = (function(superclass){
  var prototype = extend$((import$(StationDetailWin, superclass).displayName = 'StationDetailWin', StationDetailWin), superclass).prototype, constructor = StationDetailWin;
  function StationDetailWin(){
    var this$ = this;
    this.win = new UI.Menu({
      backgroundColor: 'white',
      textColor: 'black',
      highlightBackgroundColor: 'black',
      highlightTextColor: 'white'
    });
    this.win.on('select', function(e){
      if (this$.data != null) {
        return this$.selectCallback(this$.data.lines[e.sectionIndex - 1]);
      }
    });
    this.win.on('show', function(e){
      return this$.load(function(){
        return this$.update();
      });
    });
  }
  prototype.load = function(cb){
    var this$ = this;
    return Bus.getStationDetail(this.params.line, function(err, detail){
      if (err) {
        return this$.loaderrorCallback(err);
      }
      this$.data = detail;
      return cb();
    });
  };
  prototype.update = function(){
    var sections, i$, ref$, len$, i, line, desc;
    sections = [{
      title: this.data.sn,
      items: []
    }];
    for (i$ = 0, len$ = (ref$ = this.data.lines).length; i$ < len$; ++i$) {
      i = i$;
      line = ref$[i$];
      desc = line.desc ? "(" + line.desc + ")" : "";
      sections.push({
        title: line.firstTime + " - " + line.lastTime,
        items: [{
          title: line.name + " " + desc,
          subtitle: line.startSn + " -> " + line.endSn
        }]
      });
    }
    return this.win.sections(sections);
  };
  prototype.selectCallback = function(){};
  prototype.onselect = function(cb){
    return this.selectCallback = cb;
  };
  return StationDetailWin;
}(Component));
BusesDetailWin = (function(superclass){
  var prototype = extend$((import$(BusesDetailWin, superclass).displayName = 'BusesDetailWin', BusesDetailWin), superclass).prototype, constructor = BusesDetailWin;
  function BusesDetailWin(){
    var this$ = this;
    this.win = new UI.Card({
      scrollable: true
    });
    this.win.on('show', function(e){
      this$.load(function(){
        return this$.update();
      });
      return this$.runUpdateTimer();
    });
    this.win.on('hide', function(e){
      return this$.stopUpdateTimer();
    });
  }
  prototype.load = function(cb, formShow){
    var ref$, this$ = this;
    formShow == null && (formShow = true);
    if (formShow) {
      return Bus.getLineDetail(this.params.line, function(err, detail){
        if (err) {
          return this$.loaderrorCallback(err);
        }
        this$.data = detail;
        return cb();
      });
    } else if (this.data) {
      return Bus.updateBusesDetail((ref$ = import$({}, this.params.line), ref$.flpolicy = this.data.flpolicy, ref$), function(err, detail){
        if (err) {
          return this$.loaderrorCallback(err);
        }
        import$(this$.data, detail);
        return cb();
      });
    }
  };
  prototype.update = function(){
    var subtitleStr, lastTravelTime;
    this.win.title(this.data.name + " 需要" + this.data.price);
    subtitleStr = "";
    if (this.data.desc != null && this.data.desc.trim() !== "") {
      subtitleStr = this.data.depDesc || this.data.desc;
    } else if (this.data.lastTravelTime !== -1) {
      if (this.data.lastTravelTime < 60) {
        subtitleStr = this.data.lastTravelTime + "秒";
      } else {
        lastTravelTime = Math.round(this.data.lastTravelTime / 60);
        subtitleStr = lastTravelTime + "分钟";
      }
    }
    this.win.subtitle(subtitleStr);
    return this.win.body("" + this.data.firstTime + " - " + this.data.lastTime + "\n" + this.data.startSn + " -> " + this.data.endSn);
  };
  return BusesDetailWin;
}(Component));
AlertWin = (function(superclass){
  var prototype = extend$((import$(AlertWin, superclass).displayName = 'AlertWin', AlertWin), superclass).prototype, constructor = AlertWin;
  function AlertWin(){
    var this$ = this;
    this.win = new UI.Card({
      scrollable: true
    });
    this.win.on('show', function(e){
      return this$.update();
    });
  }
  prototype.update = function(){
    var type;
    type = this.params.type;
    if (type === 0) {
      this.win.title("提示");
    } else if (type === 1) {
      this.win.title("警告");
    } else if (type === 3) {
      this.win.title("错误!!");
    }
    return this.win.body(this.params.info);
  };
  return AlertWin;
}(Component));
BusUI = {
  wins: {
    nearLinesWin: new NearLinesWin,
    stationDetailWin: new StationDetailWin,
    busesDetailWin: new BusesDetailWin,
    alertWin: new AlertWin
  },
  init: function(){
    var i$, ref$, this$ = this;
    for (i$ in ref$ = this.wins) {
      (fn$.call(this, i$, ref$[i$]));
    }
    this.wins.nearLinesWin.show();
    return this.wins.nearLinesWin.onselect(function(line){
      this$.wins.stationDetailWin.show({
        line: line
      });
      return this$.wins.stationDetailWin.onselect(function(line){
        return this$.wins.busesDetailWin.show({
          line: line
        });
      });
    });
    function fn$(i, win){
      var this$ = this;
      win.onloaderror(function(error){
        win.hide();
        return this$.wins.alertWin.show({
          type: 3,
          info: error.message
        });
      });
    }
  }
};
BusUI.init();
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}