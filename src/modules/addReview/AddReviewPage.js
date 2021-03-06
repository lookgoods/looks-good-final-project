import {
	Image,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
	ActivityIndicator
} from 'react-native'
import React, { Component } from 'react'
import validate from 'src/services/validate'
import ContentView from 'src/modules/addReview/components/ContentView'
import Autocomplete from 'src/modules/addReview/components/Autocomplete'
import IconEntypo from 'react-native-vector-icons/Entypo'
import IconFontAwesome from 'react-native-vector-icons/FontAwesome'
import IconMaterial from 'react-native-vector-icons/MaterialIcons'
import ImagePicker from 'react-native-image-picker'
import NavBar from 'src/modules/shares/NavBar'
import Toast from 'react-native-simple-toast'
import { colors } from 'src/constants/mixins'
import ReviewActions from 'src/redux/actions/review'
import SearchActions from 'src/redux/actions/search'
import { connect } from 'react-redux'
import ImageActions from 'src/redux/actions/image'
import { APP_FULL_WIDTH } from 'src/constants'
import SocketIOClient from 'socket.io-client'
import constants from 'src/redux/constants'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

export class AddReviewPage extends Component {
	constructor(props) {
		super(props)
		this.socket = SocketIOClient(constants.AppURL)
		this.state = {
			coverImage: {
				url: '',
				thumbnail_url: ''
			},
			title: '',
			titleErr: '',
			name: '',
			nameErr: '',
			brand: '',
			price: '',
			tagsList: [{ tags: '' }],
			tagsMessage: [],
			rating: 0,
			ratingErr: '',
			contentList: [],
			contentMessage: [],
			contentMessageErr: [],
			isAddButton: false,
			isEditButton: false,
			isTagsButton: false,
			showListProductName: true,
			numStar: ['star-o', 'star-o', 'star-o', 'star-o', 'star-o'],
			imageSize: { width: 0, height: 0 }
		}
	}

	componentDidUpdate(prevProps, prevState) {
		if ((this.state.coverImage.url !== '') && (this.state.coverImage.url !== prevState.coverImage.url)) {
			this.getImageSize()
		}
	}

	getImageSize() {
		Image.getSize(this.state.coverImage.url, (width, height) => {
			this.setState({ imageSize: { width, height } })
		})
	}

	handleChangeTextBox(property, text) {
		const contact = this.state.contentMessage
		contact[property] = text
		this.setState({ contentMessage: contact })
	}

	handleChangeTags(property, text) {
		const tags = this.state.tagsMessage
		if (text === '') {
			this.setTagsButton(false)
		} else {
			this.setTagsButton(true)
		}
		tags[property] = text
		this.setState({ tagsMessage: tags })
	}

	waitForUpload() {
		return new Promise((resolve, reject) => {
			setInterval(() => {
				if (!this.props.upload_loading) resolve('Upload success')
			}, 100)
		})
	}

	async addCoverImage() {
		const options = {
			title: 'Select Product Cover',
			storageOptions: {
				skipBackup: true,
				path: 'images'
			}
		}

		ImagePicker.showImagePicker(options, async response => {
			if (response.didCancel) {
				console.log('User cancelled photo picker')
			} else if (response.error) {
				console.log('ImagePicker Error: ', response.error)
			} else {
				console.log('ImagePicker Success: ', response)
				this.props.uploadImage(response)
				await this.waitForUpload()
				const coverImage = {
					url: this.props.picture_url,
					thumbnail_url: this.props.thumbnail_url
				}
				this.setState({ coverImage })
			}
		})
	}

	attachPhotos() {
		const options = {
			title: 'Select Product Photo',
			storageOptions: {
				skipBackup: true,
				path: 'images'
			}
		}

		ImagePicker.showImagePicker(options, async response => {
			if (response.didCancel) {
				console.log('User cancelled photo picker')
			} else if (response.error) {
				console.log('ImagePicker Error: ', response.error)
			} else {
				console.log('ImagePicker Success: ', response)
				const contentArr = this.state.contentList
				this.props.uploadImage(response)
				await this.waitForUpload()
				contentArr.push({ type: 'picture', value: this.props.picture_url })
				this.setState({ contentList: contentArr })
				this.setAddButton()
			}
		})
	}

	setAmountRating(num) {
		this.setState({
			numStar: this.state.numStar.map((_, index) => {
				if (index < num) {
					return 'star'
				} else {
					return 'star-o'
				}
			}),
			rating: num
		})
	}

	setAddButton() {
		this.setState({ isAddButton: !this.state.isAddButton })
	}

	setEditButton() {
		this.setState({ isEditButton: !this.state.isEditButton })
	}

	setTagsButton(bool) {
		this.setState({ isTagsButton: bool })
	}

	addContentBox() {
		const contentArr = this.state.contentList
		contentArr.push({ type: 'text', value: '' })
		this.setState({ contentList: contentArr })
		this.setAddButton()
	}

	async addTagsBox() {
		const tagsArr = this.state.tagsList
		tagsArr.push({ tags: '' })
		await this.setState({ tagsList: tagsArr })
	}

	async addReview() {
		const contentMessage = this.state.contentMessage
		const contentList = this.state.contentList.map(
			(content, index) =>
				content.type === 'text'
					? { ...content, value: contentMessage[index] }
					: { ...content, value: content.value }
		)
		await this.setState({ contentList })
		await this.checkValidate()
	}

	async checkValidate() {
		const titleErr = validate(['title'], [this.state.title.trim()])
		const nameErr = validate(['name'], [this.state.name.trim()])
		const ratingErr = validate(['rating'], [this.state.rating])
		const contentMeassageErr = validate(
			['contentMessage'],
			[this.state.contentList]
		)
		await this.setState({
			titleErr,
			nameErr,
			ratingErr,
			contentMeassageErr
		})

		if (!titleErr && !nameErr && !ratingErr && !contentMeassageErr) {
			const tags = this.state.tagsMessage
			for (let i=0 ; i < tags.length ; i++) {
				console.log(tags[i] === undefined, 'tags -')
				if (tags[i] === undefined || tags[i].trim().length < 1) { 
					tags.splice(i, 1)
					i--
				}
			}
			const review = {
				title: this.state.title.trim(),
				name: this.state.name.trim(),
				price: this.state.price,
				brand: this.state.brand.trim(),
				tag: tags,
				picture_cover_url: this.state.coverImage.url,
				picture_thumbnail_url: this.state.coverImage.thumbnail_url,
				content_list: this.state.contentList,
				rating: this.state.rating	
			}
	
			await this.props.addReview(review)
			this.notify()

		} else {
			Toast.show('กรุณาเติมข้อมูลที่ * ให้ครบถ้วน', Toast.SHORT)
		}
	}

	notify() {
		this.socket.emit('notify', JSON.stringify({ followerList: this.props.currentUser.follower_list }))
	}

	deleteContentBox(key) {
		const contentList = this.state.contentList
		const contentMessage = this.state.contentMessage
		contentList.splice(key, 1)
		contentMessage.splice(key, 1)
		if (contentList.length === 0) {
			this.setState({ isEditButton: !this.state.isEditButton })
		}
		this.setState({ contentList, contentMessage })
	}

	renderLoading() {
		if (this.props.upload_loading || this.props.review_loading) {
			return <ActivityIndicator size="large" style={styles.loading} />
		} else {
			return null
		}
	}

	searchProductName(text) {
		this.setState({ name: text })
		if (text === '') this.setState({ showListProductName: true })
		else this.setState({ showListProductName: false })
		this.props.searchProductName(text)
	}

	render() {
		return (
			<KeyboardAwareScrollView
				style={{ backgroundColor: colors.white }}
				resetScrollToCoords={{ x: 0, y: 0 }}
				scrollEnabled={true}
			>
				<View
					style={styles.container}
					pointerEvents={
						this.props.upload_loading || this.props.review_loading
							? 'none'
							: 'box-none'
					}
				>
					<ScrollView
						showsVerticalScrollIndicator={false}
						scrollEventThrottle={16}
						bounces={false}
						style={styles.body}
					>
						<View
							style={{
								alignItems: 'center',
								justifyContent: 'center',
								flexDirection: 'row',
								backgroundColor: colors.lightGray2
							}}
						>
							{this.state.coverImage.url === '' ? (
								<TouchableOpacity
									style={{
										flex: 1,
										height: APP_FULL_WIDTH*0.6,
										backgroundColor: colors.gray3,
										alignItems: 'center',
										justifyContent: 'center'
									}}
									onPress={() => this.addCoverImage()}
								>
									<IconMaterial name="add-a-photo" size={100} color={colors.gray} />
								</TouchableOpacity>
							) : (
								<TouchableOpacity
									onPress={() => this.addCoverImage()}
								>
									<Image
										style={{
											height: APP_FULL_WIDTH*0.6,
											width: APP_FULL_WIDTH
										}}
										source={{ uri: this.state.coverImage.url }}
										resizeMode={ this.state.imageSize.width > this.state.imageSize.height ? 'cover' : 'contain' }
									/>
								</TouchableOpacity>
							)}
						</View>
					
						<View style={styles.sectionBody}>
							<Text style={styles.label}>
							Review Title
								<Text style={styles.fontRed}> *</Text>
							</Text>
							<View style={styles.textBox}>
								<TextInput
									style={styles.textInput}
									value={this.state.title}
									underlineColorAndroid="transparent"
									onChangeText={value => this.setState({ title: value })}
									keyboardType="default"
									onBlur={() => {
										this.setState({
											titleErr: validate(['title'], [this.state.title])
										})
									}}
									error={this.state.titleErr}
								/>
							</View>

							<Text style={styles.label}>
							Product Name<Text style={styles.fontRed}> *</Text>
							</Text>
							<Autocomplete
								containerStyle={styles.textBox}
								underlineColorAndroid="transparent"
								data={!this.props.productsName ? [] : this.props.productsName}
								defaultValue={this.state.name}
								onChangeText={text => this.searchProductName(text)}
								hideResults={this.state.showListProductName}
								renderItem={item => (
									<TouchableOpacity onPress={() => this.setState({ name: item.name, brand: item.brand, showListProductName: true})}>
										<Text style={{
											marginVertical: 5,
											color: colors.gray6,
											fontSize: 16
										}}>{item.name} {item.brand}</Text>
									</TouchableOpacity>
								)}
							/>

							<View style={{ flexDirection: 'row' }}>
								<View style={{ flex: 1, paddingRight: 10 }}>
									<Text style={styles.label}>Brand</Text>
									<View style={styles.textBox}>
										<TextInput
											style={styles.textInput}
											value={this.state.brand}
											underlineColorAndroid="transparent"
											onChangeText={value =>
												this.setState({ brand: value })
											}
											keyboardType="default"
										/>
									</View>
								</View>
								<View style={{ flex: 1, paddingLeft: 10 }}>
									<Text style={styles.label}>Price</Text>
									<View style={styles.textBox}>
										<TextInput
											style={styles.textInput}
											value={this.state.price}
											underlineColorAndroid="transparent"
											onChangeText={value =>
												this.setState({ price: value })
											}
											keyboardType='numeric'
										/>
									</View>
								</View>
							</View>

							<Text style={styles.label}>Tags</Text>
							{this.state.tagsList.map((item, key) => (
								<View key={key} style={{ flexDirection: 'row' }}>
									<View style={styles.textBox}>
										<TextInput
											style={styles.textInput}
											value={this.state.tagsMessage[key]}
											underlineColorAndroid="transparent"
											onChangeText={text => this.handleChangeTags(key, text)}
											keyboardType="default"
										/>
									</View>
									{this.state.tagsList.length - 1 === key &&
									this.state.isTagsButton && (
										<TouchableOpacity
											style={styles.buttonAddTag}
											onPress={() => this.addTagsBox()}
										>
											<IconMaterial name="add-circle" size={20} />
										</TouchableOpacity>
									)}
								</View>
							))}

							<Text style={styles.label}>
							Rating<Text style={styles.fontRed}> *</Text>
							</Text>
							<View
								style={{
									flex: 1,
									marginLeft: 15,
									marginTop: 10,
									marginBottom: 10,
									flexDirection: 'row'
								}}
							>
								{this.state.numStar.map((item, key) => (
									<TouchableOpacity
										key={key}
										onPress={() => this.setAmountRating(key + 1)}
									>
										<IconFontAwesome
											style={{ marginRight: 12 }}
											name={item}
											size={35}
											color={colors.yellow}
										/>
									</TouchableOpacity>
								))}
							</View>

							<ContentView
								contentList={this.state.contentList}
								contentMessage={this.state.contentMessage}
								isEditButton={this.state.isEditButton}
								setEditButton={() => this.setEditButton()}
								handleChangeTextBox={(index, text) =>
									this.handleChangeTextBox(index, text)
								}
								deleteContentBox={index => this.deleteContentBox(index)}
							/>

							{this.state.isAddButton && (
								<View style={styles.blockAdd}>
									<TouchableOpacity
										style={styles.buttonAdd}
										onPress={() => this.setAddButton()}
									>
										<IconMaterial name="add-circle" size={40} />
									</TouchableOpacity>
								</View>
							)}

							{!this.state.isAddButton && (
								<View style={styles.blockOption}>
									<TouchableOpacity
										style={styles.buttonOptionLeft}
										onPress={() => this.addContentBox()}
									>
										<IconEntypo name="text" size={40} />
									</TouchableOpacity>
									<TouchableOpacity
										style={styles.buttonOptionRight}
										onPress={() => this.attachPhotos()}
									>
										<IconFontAwesome name="picture-o" size={40} />
									</TouchableOpacity>
								</View>
							)}

							<View style={styles.blockSave}>
								<TouchableOpacity
									style={styles.buttonSave}
									onPress={() => this.addReview()}
								>
									<Text style={{ fontSize: 18, color: '#FFF' }}>ADD REVIEW</Text>
								</TouchableOpacity>
							</View>
						</View>
					</ScrollView>
					{this.renderLoading()}
					<View style={styles.header}>
						<View style={styles.platformHeader}>
							<NavBar titleName="Add Review" />
						</View>
					</View>
				</View>
			</KeyboardAwareScrollView>
		)
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.white
	},
	loading: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
		alignItems: 'center',
		justifyContent: 'center',
		opacity: 0.5,
		backgroundColor: colors.black
	},
	body: {
		marginTop: Platform.OS === 'ios' ? 75 : 60
	},
	platformHeader: {
		height: Platform.OS === 'ios' ? 75 : 60,
		paddingTop: Platform.OS === 'ios' ? 25 : 0
	},
	header: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: 0
	},
	label: {
		color: '#5C5C5C',
		fontSize: 15,
		marginLeft: 15,
		fontWeight: 'bold'
	},
	sectionBody: {
		backgroundColor: '#FFF',
		margin: 5,
		paddingHorizontal: 5,
		paddingTop: 10,
		paddingBottom: 10
	},
	textBox: {
		flex: 1,
		borderRadius: 3,
		justifyContent: 'center',
		backgroundColor: '#FFF',
		paddingHorizontal: 15,
		marginLeft: 15,
		marginRight: 15,
		marginTop: 10,
		marginBottom: 10,
		borderColor: '#dfdfdf',
		borderWidth: 1
	},
	textInput: {
		flex: 1,
		color: colors.gray6,
		fontSize: 15,
		height: 35,
		padding: 0
	},
	buttonAdd: {
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: colors.lightGray3,
		height: 50,
		borderRadius: 3,
		zIndex: 2,
		borderColor: '#dfdfdf',
		borderWidth: 1,
		marginBottom: 5
	},
	blockAdd: {
		paddingTop: 20,
		padding: 5
	},
	buttonSave: {
		justifyContent: 'center',
		alignItems: 'center',
		flexDirection: 'row',
		backgroundColor: colors.orange,
		height: 50,
		borderRadius: 3,
		zIndex: 2
	},
	blockSave: {
		borderTopColor: '#f1f1f1',
		borderTopWidth: 1,
		shadowColor: '#808080',
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.5,
		padding: 5
	},
	blockOption: {
		flexDirection: 'row',
		paddingTop: 20,
		padding: 5
	},
	buttonOptionLeft: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: colors.lightGray3,
		height: 50,
		borderBottomLeftRadius: 3,
		borderTopLeftRadius: 3
	},
	buttonOptionRight: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: colors.lightGray3,
		height: 50,
		borderBottomRightRadius: 3,
		borderTopRightRadius: 3
	},
	buttonAddTag: {
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 15,
		marginTop: 10,
		marginBottom: 10,
		backgroundColor: colors.white,
		height: 35,
		width: 35,
		borderRadius: 3,
		borderColor: '#dfdfdf',
		borderWidth: 1
	},
	fontRed: {
		color: colors.red
	}
})

const mapStateToProps = state => ({
	picture_url: state.imageReducer.picture_url,
	thumbnail_url: state.imageReducer.thumbnail_url,
	upload_loading: state.imageReducer.loading,
	upload_error: state.imageReducer.error,
	review_loading: state.reviewReducer.loading,
	currentUser: state.userReducer.currentUser,
	productsName: state.searchReducer.productsName
})

const mapDispatchToProps = dispatch => ({
	addReview: review => {
		dispatch(ReviewActions.addReview(review))
	},
	uploadImage: image => {
		dispatch(ImageActions.uploadImage(image))
	},
	searchProductName: name => {
		dispatch(SearchActions.searchProductName(name))
	}
})

export default connect(mapStateToProps, mapDispatchToProps)(AddReviewPage)
