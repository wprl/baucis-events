// __Dependencies__
var mubsub = require('mubsub');

// __Module Definition__
var plugin = module.exports = function () {
  var baucis = this;

  // __Public Baucis Extensions__
  // Create a subscription event channel.
  baucis.channel = function (name, options) {
    var client = mubsub(mongoose.db); // TODO allow setting
    var channelName = 'baucis';
    var channelOptions = {
      size: 100000,
      max: 500,
      retryInterval: 200,
      recreate: true
    };
    return client.channel(channelName, channelOptions);
  };

  // Have the controller emit events.
  baucis.Model.decorators(function (source, protect) {
    var model = this;
    var channel = baucis.channel();

    // Add a property to allow enabling and disabling events by tag.
    protect.multiproperty('events', false);

    if (!schema.wiredForEvents()) {
      model.schema.post('save', function () {
        if (!this.isNew) return;
        channel.publish('create', {
          model: model.singular(),
          doc: this.toJSON()
        });
      });

      model.schema.post('save', function () {
        if (this.isNew) return;
        channel.publish('update', {
          model: model.singular(),
          doc: this.toJSON()
        });
      });

      model.schema.post('remove', function () {
        channel.publish('remove', {
          model: model.singular(),
          doc: this.toJSON()
        });
      });

      schema.wiredForEvents(true);
    }
  });
}
