/* global jest */
const React = require('react');

module.exports = {
  StyleSheet: {
    create: (styles) => styles
  },
  View: (props) => React.createElement('div', props, props.children),
  Text: (props) => React.createElement('span', props, props.children),
  TouchableOpacity: (props) => React.createElement('button', props, props.children),
  ScrollView: (props) => React.createElement('div', props, props.children),
  SafeAreaView: (props) => React.createElement('div', props, props.children),
  TextInput: (props) => React.createElement('input', props),
  Alert: {
    alert: jest.fn()
  },
  Platform: {
    OS: 'ios',
    select: (obj) => obj.ios || obj.default
  }
};
