import { useState } from "react"
import { Text, TextInput, View, StyleSheet, Pressable } from "react-native"
// @Componets
import Modal from "@/components/Shared/Modal"
// @Redux
import { useDispatch, useSelector } from "react-redux"
import { selectIsNewGroupOpen, setIsNewGroupOpen } from "@/redux/slices/navigation"
// @Utils
import { tailwindColors } from '@/utils/colors'

interface NewGroupModalInterface {}

const NewGroupModal = ({}: NewGroupModalInterface) => {
	const dispatch = useDispatch()

	const isOpen = useSelector(selectIsNewGroupOpen)

	const [newGroup, setNewGroup] = useState('')

	return (
		<Modal
			open={isOpen}
			onClose={() => console.log('Mondongo #1')}
			onFinish={() => console.log('Mondongo #2')}
		>
			<View className="w-[85%] p-5 bg-white rounded-lg" style={styles.container}>
				<Text style={styles.title} className="text-2xl font-bold text-center">
					Crear nuevo grupo
				</Text>
				<TextInput
					value={newGroup}
					onChangeText={setNewGroup}
					placeholder="Nombre del nuevo grupo"
					style={styles.input}
					className="mt-6 rounded-lg"
				/>
				<View className="flex flex-row gap-4">
	 				<Pressable
						onPress={() => dispatch(setIsNewGroupOpen(false))}
						style={styles.button}
						className="w-full mt-4 p-1.5 rounded-lg"
					>
						<Text className="text-white text-xl font-bold text-center">Aceptar</Text>
					</Pressable>
	 			</View>
			</View>
		</Modal>
	)
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: tailwindColors.background.foreground,
	},
	title: {
		color: tailwindColors.secondary.DEFAULT,
	},
	input: {
		backgroundColor: tailwindColors.background.DEFAULT,
	},
	button: {
		backgroundColor: tailwindColors.secondary.DEFAULT,
	},
})

export default NewGroupModal