package utils

import "golang.org/x/crypto/bcrypt"

//hash password sebelum disimpan ke db. FUNGSI HASH PW=REGISTER
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

//cek password saat login. FUNGSI CHECKPW=LOGIN
func CheckPassword(hash string, password string) bool {
	err := bcrypt.CompareHashAndPassword(
		[]byte(hash),     //hash dari database
		[]byte(password), //password dari input user
	)
	return err == nil
}
