import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// @COMPONENTS
import HomeScreen from "./screens/Home"
import CreateScreen from './screens/Create'
import SearchScreen from './screens/Search'
import SettingsScreen from './screens/Settings'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faMugSaucer } from '@fortawesome/free-solid-svg-icons/faMugSaucer'

const Tab = createBottomTabNavigator();

const TabScreenOptions = {
	headerShown: false
}

export const Navigator = () => {
  return (
    <Tab.Navigator initialRouteName="Home">
      <Tab.Screen
				name="Home"
				component={HomeScreen}
				options={{
					headerShown: false,
					tabBarIcon: () => (
						<FontAwesomeIcon icon={faMugSaucer} />
					)
				}}
			/>
			<Tab.Screen
				name="Create"
				component={CreateScreen}
				options={TabScreenOptions}
			/>
			<Tab.Screen
				name="Search"
				component={SearchScreen}
				options={TabScreenOptions}
			/>
			<Tab.Screen
				name="Settings"
				component={SettingsScreen}
				options={TabScreenOptions}
			/>
    </Tab.Navigator>
  );
};
