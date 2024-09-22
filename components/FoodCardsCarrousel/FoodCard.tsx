import { ImageBackground, Text, View } from "react-native"
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faCalendarMinus, faBlender, faFireBurner } from '@fortawesome/free-solid-svg-icons'

export interface FoodCardInterface {
	id: number,
	title: string,
	time: number,
	tool: string,
	img: string,
}

const FoodCard = ({ title, time, tool, img }: FoodCardInterface) => {
	
	const getIcon = () => {
		switch(tool) {
			case 'oven':
				return <FontAwesomeIcon icon={faFireBurner} size={18} color="#FFF" />
			case 'blender':
				return <FontAwesomeIcon icon={faBlender} size={18} color="#FFF" />
			default: 
				return <FontAwesomeIcon icon={faCalendarMinus} size={18} color="#FFF" />
		}
	}

	return (
		<ImageBackground
			className="h-[40vh] w-44"
			resizeMode="cover"
			src={img}
			imageStyle={{ borderRadius: 8 }}
		>
			<View className="bg-black/30 h-full px-3 flex justify-between rounded-lg">
				<Text className="mt-2 text-xl font-semibold text-white">{title}</Text>
				<View className="mb-2 flex flex-row gap-2">
					{getIcon()}
					<Text className="text-white">{time}</Text>
				</View>
			</View>
		</ImageBackground>
	)
}

export default FoodCard