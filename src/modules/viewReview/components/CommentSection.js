import React, { Component } from 'react'
import {
	StyleSheet,
	Text,
	View,
	TouchableOpacity,
	Clipboard
} from 'react-native'
import ActionSheet from 'react-native-actionsheet'
import AddComment from 'src/modules/viewReview/components/AddComment'
import AddCommentChat from 'src/modules/viewReview/components/AddCommentChat'
import Comment from 'src/modules/viewReview/components/Comment'
import CommentChat from 'src/modules/viewReview/components/CommentChat'
import StarBar from 'src/modules/viewReview/components/StarBar'
import { colors } from 'src/constants/mixins'
import { connect } from 'react-redux'
import { Divider } from 'react-native-elements'
import Tabs from 'src/modules/shares/Tabs'

function countRatingFrequency(comment_list) {
	let rating_frequency_list = [0, 0, 0, 0, 0]
	for (const comment of comment_list) {
		rating_frequency_list[5-comment.rating]++ 
	}
	return rating_frequency_list
}

function RatingFrequency ({ comment_list }) {
	const rating_frequency_list = countRatingFrequency(comment_list)
	return (
		<View style={styles.ratingFrequencyPanel}>
			{ rating_frequency_list.map((rating_count, index) => (
				<View style={styles.ratingRow} key={index}>
					<StarBar rating={5-index} size={20} type='view' />
					<View style={styles.progressBar}>
						<View style={{ height: 15, width: `${rating_count/(comment_list.length)*100}%`, backgroundColor: colors.orange}}/>
					</View>
					<Text>{rating_count}</Text>
				</View>
			))}
		</View>
	)
}
    
class CommentSection extends Component {
	constructor (props) {
		super(props)
		this.state = {
			indexComment: -1,
			indexChat: -1
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		return (this.props.comments !== nextProps.comments) || (this.props.chats !== nextProps.chats)
	}

	async showActionSheet1(index) {
		await this.setState({ indexComment: index })
		this.ActionSheet1.show()
	}

	async showActionSheet2(index) {
		await this.setState({ indexComment: index })
		this.ActionSheet2.show()
	}

	async showActionSheet3(index) {
		await this.setState({ indexChat: index })
		this.ActionSheet3.show()
	}

	async showActionSheet4(index) {
		await this.setState({ indexChat: index })
		this.ActionSheet4.show()
	}

	optionsSelect1(index) {
		const comment_list = this.props.comments
		if (index === 0) {
			this.props.setEditComment(comment_list[this.state.indexComment]._id)
		} else if (index === 1) {
			Clipboard.setString(comment_list[this.state.indexComment].description)
		} else if (index === 2) {
			this.props.deleteComment(this.props.review._id, comment_list[this.state.indexComment]._id)
		}
	}

	optionsSelect2(index) {
		const comment_list = this.props.comments
		if (index === 0) {
			Clipboard.setString(comment_list[this.state.indexComment].description)
		}
	}

	render() {
		console.log(this.props.comments, 'this.props.comments')
		console.log(this.props.chats, 'this.props.chats')
		const comment_list = this.props.comments
		const chat_list = this.props.chats
		const user = this.props.currentUser
		if (!comment_list || !this.props.successComment || !chat_list || !this.props.successChat) return <View/>
		return (
			<View>
				<View>
					<Divider style={styles.divider} />
					<View style={styles.tabsContainer}>
						<Tabs>
							<View title="Comment">
								<View style={styles.commentList}>
									{ chat_list.map((comment, index) => (
										<View key={index}>
											{ user._id === comment.user._id ?
												<TouchableOpacity 
													delayLongPress={1000} 
													onLongPress = {() => this.showActionSheet1(index)}>
													<View style = {styles.chatItem} >
														<CommentChat
															comment={comment}
															type={'chat'}
														/>
													</View>
												</TouchableOpacity> 
												:
												<TouchableOpacity 
													delayLongPress={1000} 
													onLongPress = {() => this.showActionSheet2(index)}>
													<View style = {styles.chatItem} >
														<CommentChat
															comment={comment}
														/>
													</View>
												</TouchableOpacity>
											}
										</View>
									))}
									<View>
										<Divider style={styles.divider} />
										<AddCommentChat 
											style={styles.addComment} 
											user={this.props.currentUser} 
											addChat={(chat) => this.props.addChat(chat)}
										/>
									</View>
								</View>
							</View>
							<View title="Review">
								<Text style={styles.totalText}>{comment_list.length} Reviews</Text>
								<RatingFrequency comment_list={comment_list}/>
								<View style={styles.commentList}>
									{ comment_list.map((comment, index) => (
										<View key={index}>
											{ user._id === comment.user._id ?
												<TouchableOpacity 
													delayLongPress={1000} 
													onLongPress = {() => this.showActionSheet1(index)}>
													<View style = {styles.commentItem} >
														<Comment
															comment={comment}
														/>
													</View>
												</TouchableOpacity> 
												:
												<TouchableOpacity 
													delayLongPress={1000} 
													onLongPress = {() => this.showActionSheet2(index)}>
													<View style = {styles.commentItem} >
														<Comment
															comment={comment}
														/>
													</View>
												</TouchableOpacity>
											}
										</View>
									))}
								</View>
								{ this.props.currentUser._id !== this.props.review.user._id &&
						<View>
							<Divider style={styles.divider} />
							<AddComment 
								style={styles.addComment} 
								user={this.props.currentUser} 
								addComment={(comment) => this.props.addComment(comment)}
							/>
						</View>
								}
							</View>
						</Tabs>
					</View> 
					<ActionSheet
						ref={o => this.ActionSheet1 = o}
						options={['Edit', 'Copy', 'Delete', 'Cancel']}
						cancelButtonIndex={3}
						destructiveButtonIndex={2}
						onPress={(index) => this.optionsSelect1(index)}
					/>
					<ActionSheet
						ref={o => this.ActionSheet2 = o}
						options={['Copy', 'Cancel']}
						cancelButtonIndex={1}
						onPress={(index) => this.optionsSelect2(index)}
					/>
				</View>
			</View>
		)
	}
}

const styles = StyleSheet.create({
	totalText: {
		fontWeight: 'bold',
		marginTop: 15,
		marginLeft: 30
	},
	tabsContainer: {
		marginTop: 20,
		paddingLeft: 12,
		paddingRight: 12
	},
	ratingRow: {
		flexDirection: 'row'
	},
	ratingFrequencyPanel: {
		marginTop: 10,
		marginLeft: 0,
		marginBottom: 20
	},
	progressBar: {
		backgroundColor: colors.lightGray,
		height: 15,
		width: '50%',
		marginTop: 5,
		marginBottom: 5,
		marginLeft: 10,
		marginRight: 10
	},
	commentList: {
		marginLeft: 20
	},
	commentItem: {
		marginBottom: 10
	},
	chatItem: {
		marginBottom: 5
	},
	divider: {
		backgroundColor: colors.lightGray,
		marginTop: 5,
		height: 1.2,
		width: '100%'
	}
})

const mapStateToProps = state => ({
	currentUser: state.userReducer.currentUser,
	comments: state.commentReducer.comments,
	chats: state.chatReducer.chats,
	successComment: state.commentReducer.success,
	successChat: state.chatReducer.success
})

export default connect(mapStateToProps, null)(CommentSection)
