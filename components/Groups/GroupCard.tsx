import { Text, TouchableOpacity, StyleSheet} from "react-native"
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"

interface GroupCardInterface {
	name: string,
	icon: any,
}

const GroupCard = ({
	name,
	icon = faCirclePlus,
}: GroupCardInterface) => {
	return (
		<TouchableOpacity
			onPress={() => console.log('Group:', name)}
			style={styles.container}
		>
				<FontAwesomeIcon
					icon={icon}
					size={40}
				/>
				<Text>{name}</Text>
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	container: {
		maxWidth: '48%',
		marginTop: 8,
		paddingVertical: 4,
		flex: 1,
		alignItems: 'center',
		borderRadius: 10,
		backgroundColor: 'gray',
	}
})

export default GroupCard
