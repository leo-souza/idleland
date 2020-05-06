module.exports = new function(){
  var public = this;
  var raw_data = {};

  ////
  this.addModel = function(name) {
    if (!raw_data[name]) raw_data[name] = {};
  }

  this.find = function(model, uid) {
    if (raw_data[model]) {
      return raw_data[model][uid];
    }
    return null;
  }

  this.findAll = function(model) {
    if (raw_data[model]) {
      return Object.values(raw_data[model]);
    }
    return [];
  }

  this.destroy = function(model, uid) {
    if (raw_data[model] && raw_data[model][uid]) {
      delete raw_data[model][uid];
    }
  }

  this.create = function(model, attrs) {
    if (raw_data[model] && attrs.uid) {
      raw_data[model][attrs.uid] = attrs;
      return attrs;
    }
  }

  this.update = function(model, attrs) {
    if (raw_data[model] && attrs.uid && raw_data[model][attrs.uid]) {
      raw_data[model][attrs.uid] = attrs;
    }
  }

};
