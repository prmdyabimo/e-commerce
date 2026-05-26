package utils

import "golang.org/x/crypto/bcrypt"

//hash password before saving to db. HASH FUNCTION PW=REGISTER
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

//Check password when logging in. FUNCTION CHECKPW=LOGIN
func CheckPassword(hash string, password string) bool {
	err := bcrypt.CompareHashAndPassword(
		[]byte(hash),     //hash from database
		[]byte(password), //password from input user
	)
	return err == nil
}
