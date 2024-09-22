import { useState } from "react"

import { Text, TextInput, View, StyleSheet, Pressable } from "react-native"
import Modal from "@/components/Shared/Modal"

import { tailwindColors } from '@/utils/colors'

interface NewGroupModalInterface {
	isOpen: boolean,
	setIsOpen: (open: boolean) => void
}

const NewGroupModal = ({ isOpen, setIsOpen }: NewGroupModalInterface) => {
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
						onPress={() => setIsOpen(false)}
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