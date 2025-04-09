// Importing necessary packages and components
import React, {useState, useRef, forwardRef, useImperativeHandle} from 'react';
import {
  Animated,
  PanResponder,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  View,
  StyleSheet,
} from 'react-native';
import styles from './style';

// Creating the RBSheet component
const RBSheet = forwardRef((props, ref) => {
  // Props destructuring
  const {
    height = 260,
    openDuration = 300,
    closeDuration = 200,
    closeOnPressMask = true,
    closeOnPressBack = false,
    draggable = false,
    dragOnContent = false,
    useNativeDriver = false,
    customStyles = {},
    customModalProps = {},
    customAvoidingViewProps = {},
    onOpen = null,
    onClose = null,
    children = <View />,
  } = props;

  // Using useState hook to manage modal visibility
  const [modalVisible, setModalVisible] = useState(false);

  // Using useRef hook to reference animated values
  const translateY = useRef(new Animated.Value(height)).current;
  const panY = useRef(new Animated.Value(0)).current;

  // Exposing component methods to parent via useImperativeHandle hook
  useImperativeHandle(ref, () => ({
    open: () => handleSetVisible(true),
    close: () => handleSetVisible(false),
  }));

  // Function to create PanResponder
  const createPanResponder = () => {
    return PanResponder.create({
      // Respond only if draggable is true
      onStartShouldSetPanResponder: () => draggable,

      // Respond only if draggable, dragOnContent is true, and vertical movement is positive
      onMoveShouldSetPanResponder: (e, gestureState) =>
        draggable && dragOnContent && gestureState.dy > 0,

      // Update pan.y value on vertical move if gestureState.dy is positive
      onPanResponderMove: (e, gestureState) => {
        gestureState.dy > 0 && panY.setValue(gestureState.dy);
      },

      // Handle when the user has released the touche
      onPanResponderRelease: (e, gestureState) => {
        // Close modal if swipe down distance is more than 100
        if (gestureState.dy > 100) {
          handleSetVisible(false);
        } else {
          // Reset pan to original position on release
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver,
          }).start();
        }
      },
    });
  };

  // Referencing the panResponder
  const panResponder = useRef(createPanResponder()).current;

  // Function to handle the visibility of the modal
  const handleSetVisible = visible => {
    if (visible) {
      panY.setValue(0); // reset drag first
      translateY.setValue(height); // start hidden
      setModalVisible(true);
      if (typeof onOpen === 'function') {
        onOpen();
      }

      Animated.timing(translateY, {
        useNativeDriver: true,
        toValue: 0,
        duration: openDuration,
      }).start();
    } else {
      Animated.timing(translateY, {
        useNativeDriver: true,
        toValue: height,
        duration: closeDuration,
      }).start(() => {
        translateY.setValue(height); // reset for next open
        panY.setValue(0); // reset drag too
        setModalVisible(false);
        if (typeof onClose === 'function') {
          onClose();
        }
      });
    }
  };

  // Returning the RBSheet component
  return (
    <Modal
      testID="Modal"
      transparent
      visible={modalVisible}
      onRequestClose={closeOnPressBack ? () => handleSetVisible(false) : null} // Close on hardware button press (Android) if enabled
      {...customModalProps}>
      <KeyboardAvoidingView
        testID="KeyboardAvoidingView"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.wrapper, customStyles.wrapper]}
        {...customAvoidingViewProps}>
        <TouchableOpacity
          testID="TouchableOpacity"
          style={styles.mask}
          activeOpacity={1}
          onPress={closeOnPressMask ? () => handleSetVisible(false) : null} // Close on mask press if enabled
        />
        <Animated.View
          testID="AnimatedView"
          {...(dragOnContent && panResponder.panHandlers)} // Attach pan handlers to content if dragOnContent is true
          style={[
            styles.container,
            {transform: [{translateY: translateY}, {translateY: panY}], height},
            // {
            //   transform: [
            //     {translateY: Animated.subtract(translateY, panY)}, // Combine open animation and drag gesture
            //   ],
            // },
            customStyles.container,
          ]}>
          {draggable && ( // Show draggable icon if set it to true
            <View
              testID="DraggableView"
              {...(!dragOnContent && panResponder.panHandlers)} // Attach pan handlers to draggable icon if dragOnContent is false
              style={styles.draggableContainer}>
              <View
                testID="DraggableIcon"
                style={[styles.draggableIcon, customStyles.draggableIcon]}
              />
            </View>
          )}
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

// Exporting the RBSheet component
export default RBSheet;
