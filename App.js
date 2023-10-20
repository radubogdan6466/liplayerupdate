import React from 'react';
import {View, StatusBar, StyleSheet} from 'react-native';
import MusicPlayer from './screens/Musicplayer';

const App = () => {
  return (
    <View style={style.container}>
      <MusicPlayer />
      <StatusBar barStyle="light-content" />
    </View>
  );
};

export default App;

const style = StyleSheet.create({
  container: {
    flex: 1,
  },
});
