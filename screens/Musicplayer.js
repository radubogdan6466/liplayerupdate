import React, {useEffect, useRef, useState} from 'react';
import TrackPlayer, {
  Capability,
  Event,
  RepeatMode,
  State,
  usePlaybackState,
  useProgress,
  useTrackPlayerEvents,
} from 'react-native-track-player';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  Image,
  FlatList,
  Animated,
} from 'react-native';
import Slider from '@react-native-community/slider';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import songs from '../model/Data';

const {width, height} = Dimensions.get('window');

async function setup() {
  await TrackPlayer.setupPlayer({});
  await TrackPlayer.updateOptions({
    stopWithApp: false,
    capabilities: [TrackPlayer.CAPABILITY_PLAY, TrackPlayer.CAPABILITY_PAUSE],
    compactCapabilities: [
      TrackPlayer.CAPABILITY_PLAY,
      TrackPlayer.CAPABILITY_PAUSE,
      TrackPlayer.CAPABILITY_SKIP_TO_NEXT,
      TrackPlayer.CAPABILITY_SKIP_TO_PREVIOUS,
      TrackPlayer.CAPABILITY_SEEK_TO,
      TrackPlayer.CAPABILITY_STOP,
    ],
    compactCapabilities: [Capability.Play, Capability.Pause],
  });
}

const MusicPlayer = () => {
  const playBackState = usePlaybackState();
  const progress = useProgress();
  const [songIndex, setsongIndex] = useState(0);
  const [repeatMode, setRepeatMode] = useState('off');
  const [trackTitle, setTrackTitle] = useState();
  const [trackArtist, setTrackArtist] = useState();
  const [trackArtwork, setTrackArtwork] = useState();
  const scrollX = useRef(new Animated.Value(0)).current;
  const songSlider = useRef(null);

  useEffect(() => {
    setup();
    const setupPlayer = async () => {
      try {
        await TrackPlayer.setupPlayer();
        await TrackPlayer.add(songs);
        console.log('Songs added---------------');
      } catch (error) {
        console.log(error);
      }
    };

    setupPlayer();

    scrollX.addListener(({value}) => {
      const index = Math.round(value / width);
      skipTo(index);
      setsongIndex(index);
    });

    return () => {
      scrollX.removeAllListeners();
      TrackPlayer.destroy();
    };
  }, []);

  const togglePlayBack = async playBackState => {
    const currentTrack = await TrackPlayer.getCurrentTrack();
    console.log(currentTrack, playBackState, State.Playing);
    if (currentTrack != null) {
      if (playBackState == State.Paused) {
        await TrackPlayer.play();
      } else {
        await TrackPlayer.pause();
      }
    }
  };

  useTrackPlayerEvents([Event.PlaybackTrackChanged], async event => {
    if (event.type === Event.PlaybackTrackChanged && event.nextTrack !== null) {
      const track = await TrackPlayer.getTrack(event.nextTrack);
      const {title, artwork, artist} = track;
      setTrackTitle(title);
      setTrackArtist(artist);
      setTrackArtwork(artwork);
    }
  });

  const repeatIcon = () => {
    if (repeatMode == 'off') {
      return 'repeat-off';
    }

    if (repeatMode == 'track') {
      return 'repeat-once';
    }

    if (repeatMode == 'repeat') {
      return 'repeat';
    }
  };

  const changeRepeatMode = () => {
    if (repeatMode == 'off') {
      TrackPlayer.setRepeatMode(RepeatMode.Track);
      setRepeatMode('track');
    }

    if (repeatMode == 'track') {
      TrackPlayer.setRepeatMode(RepeatMode.Queue);
      setRepeatMode('repeat');
    }

    if (repeatMode == 'repeat') {
      TrackPlayer.setRepeatMode(RepeatMode.Off);
      setRepeatMode('off');
    }
  };

  const skipTo = async trackId => {
    await TrackPlayer.skip(trackId);
  };

  const skipToNext = () => {
    songSlider.current.scrollToOffset({
      offset: (songIndex + 1) * width,
    });
  };

  const skipToPrevious = () => {
    songSlider.current.scrollToOffset({
      offset: (songIndex - 1) * width,
    });
  };

  const renderSongs = ({item, index}) => {
    const imageSource = trackArtwork
      ? trackArtwork
      : require('../assets/img/default.jpg');
    return (
      <Animated.View style={style.mainWrapper}>
        <View style={[style.imageWrapper, style.elevation]}>
          <Image source={imageSource} style={style.musicImage} />
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={style.container}>
      {/* music player section */}
      <View style={style.mainContainer}>
        {/* Image */}

        <Animated.FlatList
          ref={songSlider}
          renderItem={renderSongs}
          data={songs}
          keyExtractor={item => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [
              {
                nativeEvent: {
                  contentOffset: {x: scrollX},
                },
              },
            ],
            {useNativeDriver: true},
          )}
        />

        {/* Title & Artist Name */}
        <View>
          <Text style={[style.songContent, style.songTitle]}>
            {/* {songs[songIndex].title} */ trackTitle}
          </Text>
          <Text style={[style.songContent, style.songArtist]}>
            {/* {songs[songIndex].artist} */ trackArtist}
          </Text>
        </View>

        {/* songslider */}
        <View>
          <Slider
            style={style.progressBar}
            value={progress.position}
            minimumValue={0}
            maximumValue={progress.duration}
            thumbTintColor="#FFD369"
            minimumTrackTintColor="#FFD369"
            maximumTrackTintColor="#fff"
            onSlidingComplete={async value => {
              await TrackPlayer.seekTo(value);
              if (playBackState === State.Playing) {
                await TrackPlayer.play(); // Reia redarea dacă melodia era în curs de desfășurare
              }
            }}
          />

          {/* Progress Durations */}
          <View style={style.progressLevelDuraiton}>
            <Text style={style.progressLabelText}>
              {(() => {
                const date = new Date(progress.position * 1000);
                date.setUTCHours(0); // Setează temporar ora UTC
                const minutes = date
                  .getUTCMinutes()
                  .toString()
                  .padStart(2, '0');
                const seconds = date
                  .getUTCSeconds()
                  .toString()
                  .padStart(2, '0');
                return `${minutes}:${seconds}`;
              })()}
            </Text>
            <Text style={style.progressLabelText}>
              {(() => {
                const date = new Date(
                  (progress.duration - progress.position) * 1000,
                );
                date.setUTCHours(0);
                const minutes = date
                  .getUTCMinutes()
                  .toString()
                  .padStart(2, '0');
                const seconds = date
                  .getUTCSeconds()
                  .toString()
                  .padStart(2, '0');
                return `${minutes}:${seconds}`;
              })()}
            </Text>
          </View>
        </View>

        {/* music control */}
        <View style={style.musicControlsContainer}>
          <TouchableOpacity onPress={() => TrackPlayer.skipToPrevious()}>
            <Ionicons name="play-skip-back-outline" size={35} color="#FFD369" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (playBackState === State.Playing) {
                TrackPlayer.pause(); // Dacă muzica rulează, apasarea butonului va pune în pauză redarea.
              } else {
                TrackPlayer.play(); // Dacă muzica este în pauză, apasarea butonului va începe redarea.
              }
            }}>
            <Ionicons
              name={
                playBackState === State.Playing
                  ? 'pause-circle-outline'
                  : 'play-circle-outline'
              }
              size={75}
              color="#FFD369"
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => TrackPlayer.skipToNext()}>
            <Ionicons
              name="play-skip-forward-outline"
              size={35}
              color="#FFD369"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* bottom section */}
      <View style={style.bottomSection}>
        <View style={style.bottomIconContainer}>
          <TouchableOpacity onPress={() => {}}>
            <Ionicons name="heart-outline" size={30} color="#888888" />
          </TouchableOpacity>

          <TouchableOpacity onPress={changeRepeatMode}>
            <MaterialCommunityIcons
              name={`${repeatIcon()}`}
              size={30}
              color={repeatMode !== 'off' ? '#FFD369' : '#888888'}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => {}}>
            <Ionicons name="share-outline" size={30} color="#888888" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => {}}>
            <Ionicons name="ellipsis-horizontal" size={30} color="#888888" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default MusicPlayer;

const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222831',
  },
  mainContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSection: {
    borderTopColor: '#393E46',
    borderWidth: 1,
    width: width,
    alignItems: 'center',
    paddingVertical: 15,
  },

  bottomIconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },

  mainWrapper: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },

  imageWrapper: {
    width: 300,
    height: 340,
    marginBottom: 25,
  },
  musicImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  elevation: {
    elevation: 5,

    shadowColor: '#ccc',
    shadowOffset: {
      width: 5,
      height: 5,
    },
    shadowOpacity: 0.5,
    shadowRadius: 3.84,
  },
  songContent: {
    textAlign: 'center',
    color: '#EEEEEE',
  },
  songTitle: {
    fontSize: 18,
    fontWeight: '600',
  },

  songArtist: {
    fontSize: 16,
    fontWeight: '300',
  },

  progressBar: {
    width: 350,
    height: 40,
    marginTop: 25,
    flexDirection: 'row',
  },
  progressLevelDuraiton: {
    width: 340,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabelText: {
    color: '#FFF',
  },

  musicControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    width: '60%',
  },
});
