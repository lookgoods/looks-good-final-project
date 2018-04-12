import {
	Platform,
	ScrollView,
	StyleSheet,
	View
} from 'react-native'
import React, { Component } from 'react'

import NavBarSearch from 'src/modules/shares/NavBarSearch'
import { colors } from 'src/constants/mixins'
import ReviewActions from 'src/redux/actions/review'
import { connect } from 'react-redux'
import UserActions from 'src/redux/actions/user'
import ReviewsGrid from 'src/modules/user/components/ReviewsGrid'
import { Actions } from 'react-native-router-flux'

export class GlobalPage extends Component {
	constructor(props) {
		super(props)
		this.state = {
			isSearch: false,
			searchText: ''
		}
	}

	fetchData() {
		this.props.getReviews()
		this.props.getCurrentUser()
	}

	componentDidMount() {
		this.fetchData()
	}

	shouldComponentUpdate(nextProps, nextState) {
		return (this.props.currentUser !== nextProps.currentUser) || 
		(this.props.reviews !== nextProps.reviews) || 
		(this.props.currentPage !== nextProps.currentPage)
	}
	
	componentDidUpdate(prevProps, prevState) {
		if ((this.props.currentPage !== prevProps.currentPage) && this.props.currentPage === 'global') {
			this.fetchData()
		}
	}

	setIsSearch() {
		this.setState({ isSearch: true })
	}

	handleSearchText(text) {
		if (text === '') {
			this.setState({ isSearch: false })
		} else {
			this.setState({ isSearch: true })
		}
		this.setState({ searchText: text })
	}

	async cancelSearch() {
		await this.setState({
			isSearch: false,
			searchText: ''
		})
	}

	render() {
		if (!this.props.currentUser) {
			if (this.props.userSuccess) {
				Actions.loginPage()
			}
			return <View/>
		}
		return (
			<View style={styles.container}>
				<View style={styles.header}>
					<View style={styles.platformHeader}>
						<NavBarSearch
							searchText={this.state.searchText}
							isSearch={this.state.isSearch}
							handleSearchText={text => this.handleSearchText(text)}
							setIsSearch={() => this.setIsSearch()}
							cancelSearch={() => this.cancelSearch()}
						/>
					</View>
				</View>
				<ScrollView>
					<View style={styles.body}>
						<ReviewsGrid review_list={this.props.reviews} />
					</View>
				</ScrollView>
			</View>
		)
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.white
	},
	body: {
		backgroundColor: colors.white
	},
	platformHeader: {
		height: Platform.OS === 'ios' ? 75 : 60,
		paddingTop: Platform.OS === 'ios' ? 25 : 8
	},
	header: {
		backgroundColor: colors.white,
		overflow: 'hidden'
	}
})

const mapStateToProps = state => ({
	reviews: state.reviewReducer.reviews,
	currentUser: state.userReducer.currentUser,
	currentPage: state.menuReducer.currentPage,
	userSuccess: state.userReducer.success
})

const mapDispatchToProps = dispatch => ({
	getReviews: () => {
		dispatch(ReviewActions.getReviews())
	},
	getCurrentUser: () => {
		dispatch(UserActions.getCurrentUser())
	}
})


export default connect(mapStateToProps, mapDispatchToProps)(GlobalPage)

