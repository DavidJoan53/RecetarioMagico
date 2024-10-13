import { FlatList, View } from 'react-native';
// @Components
import { faBowlRice, faCirclePlus, faCookieBite, faDrumstickBite, faEgg, faStar } from '@fortawesome/free-solid-svg-icons';
import GroupCard from '@/components/Groups/GroupCard';
import NewGroupModal from '@/components/Groups/NewGroupModal';
// @Redux
import { useDispatch } from 'react-redux';
import { setIsNewGroupOpen } from '@/redux/slices/navigation';
// import FoodCardsCarrousel from '@/components/FoodCardsCarrousel/FoodCardsCarrousel';

const HomeScreen = ({ navigation }) => {
	const dispatch = useDispatch()
	// const desayunoPlaceholder = [
	// 	{
	// 		id: 1,
	// 		title: 'Cafesito meloso',
	// 		img: 'https://fastly.picsum.photos/id/1060/536/354.jpg?blur=2&hmac=0zJLs1ar00sBbW5Ahd_4zA6pgZqCVavwuHToO6VtcYY',
	// 		tool: 'blender',
	// 		time: 2.25
	// 	},
	// 	{
	// 		id: 2,
	// 		title: 'Cafesito meloso',
	// 		img: 'https://fastly.picsum.photos/id/1060/536/354.jpg?blur=2&hmac=0zJLs1ar00sBbW5Ahd_4zA6pgZqCVavwuHToO6VtcYY',
	// 		tool: 'blender',
	// 		time: 2.25
	// 	},
	// 	{
	// 		id: 3,
	// 		title: 'Cafesito meloso',
	// 		img: 'https://fastly.picsum.photos/id/1060/536/354.jpg?blur=2&hmac=0zJLs1ar00sBbW5Ahd_4zA6pgZqCVavwuHToO6VtcYY',
	// 		tool: 'blender',
	// 		time: 2.25
	// 	},
	// 	{
	// 		id: 4,
	// 		title: 'Cafesito meloso',
	// 		img: 'https://fastly.picsum.photos/id/1060/536/354.jpg?blur=2&hmac=0zJLs1ar00sBbW5Ahd_4zA6pgZqCVavwuHToO6VtcYY',
	// 		tool: 'blender',
	// 		time: 2.25
	// 	}
	// ]

	const defaultGroups = [
		{ id: 'favorites', name: 'Favoritos', icon: faStar },
		{ id: 'breakfast', name: 'Desayuno', icon: faEgg },
		{ id: 'lunch', name: 'Almuerzo', icon: faBowlRice },
		{ id: 'dinner', name: 'Cena', icon: faDrumstickBite },
		{ id: 'snacks', name: 'Refrigerio', icon: faCookieBite },
		{ id: 'newGroup', name: 'Nuevo grupo', icon: faCirclePlus },
	]

  return (
    <View
			className='h-screen mx-4 pt-4'
			style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}
		// contentInsetAdjustmentBehavior="automatic"
		>
			{/* <FoodCardsCarrousel
				title={'Desayuno'}
				items={desayunoPlaceholder}
			/>
			<FoodCardsCarrousel
				title={'Almuerzo'}
				items={[]}
			/>
			<FoodCardsCarrousel
				title={'Cena'}
				items={[]}
			/> */}

			<FlatList
				numColumns={2}
				data={defaultGroups}
				columnWrapperStyle={{ gap: 10 }}
				keyExtractor={item => item.name}
				renderItem={({item}) => {
					const handleTouch = item.id === 'newGroup' ? () => dispatch(setIsNewGroupOpen(true)) : () => navigation.navigate(`/groups/${item.id}`)
					return (
						<GroupCard {...item} handleTouch={handleTouch} />
					)
				}}
			/>

			<NewGroupModal />

			{/* {defaultGroups.map(group =>
				<GroupCard {...group} style={{ flex: 1 }} />
			)} */}
    </View>
  );
};

export default HomeScreen;
