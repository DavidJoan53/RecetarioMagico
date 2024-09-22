import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// @COMPONENTS
import SearchBar from './SearchBar';
import HomeScreen from "@/screens/Home"
import CalendarScreen from '@/screens/Calendar'
import CreateScreen from '@/screens/Create'
import SettingsScreen from '@/screens/Settings'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faHome, faCalendarDay, faCirclePlus, faCogs } from '@fortawesome/free-solid-svg-icons'
import { tailwindColors } from '@/utils/colors'


const Tab = createBottomTabNavigator();

export const Navigator = () => {
  return (
    <Tab.Navigator
			initialRouteName="Home"
			screenOptions={{
				headerStyle: {
          backgroundColor: tailwindColors.primary,
        },
				headerTitle: (props) => <SearchBar/>,
			}}
		>
      <Tab.Screen
				name="Home"
				component={HomeScreen}
				options={{
					tabBarIcon: () => (
						<FontAwesomeIcon icon={faHome} size={24} />
					)
				}}
			/>
			<Tab.Screen
				name="Calendar"
				component={CalendarScreen}
				options={{
					headerShown: false,
					tabBarIcon: () => (
						<FontAwesomeIcon icon={faCalendarDay} size={24} />
					)
				}}
			/>
			<Tab.Screen
				name="Create"
				component={CreateScreen}
				options={{
					headerShown: false,
					tabBarIcon: () => (
						<FontAwesomeIcon icon={faCirclePlus} size={24} />
					)
				}}
			/>
			<Tab.Screen
				name="Settings"
				component={SettingsScreen}
				options={{
					headerShown: false,
					tabBarIcon: () => (
						<FontAwesomeIcon icon={faCogs} size={24} />
					)
				}}
			/>
    </Tab.Navigator>
  );
};
