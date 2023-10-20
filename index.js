/**
 * @format
 */
TrackPlayer.registerPlaybackService(() => require('./service.js'));

import {AppRegistry} from 'react-native';
import App from './App.js';
import {name as appName} from './app.json';
import TrackPlayer from 'react-native-track-player';

AppRegistry.registerComponent(appName, () => App);
