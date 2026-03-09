import profileImg from '../../images/profile_image.png';
import "../../styles/accountStyle.css"

export function Account() {
    return (

        <div className='profile_page'>
            <h1>User Profile</h1>
            <br></br>
            <img src={profileImg} />
            <br></br>
            <div>
                <p><strong>First Name:</strong> John</p>
                <p><strong>Last Name:</strong> Doe</p>
                <p><strong>Nationality:</strong> British</p>
                <p><strong>Semester:</strong> Fall </p>
                <p><strong>Email: </strong>john@example.com</p>
                <p><strong>Link:</strong> https://www.linkedin.com/in/john_Doe123/</p>
            </div>
        </div>
    )
}