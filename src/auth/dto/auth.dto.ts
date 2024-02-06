import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AuthDto {
	/* Auth DTO Class */
	@IsEmail()
	@IsNotEmpty()
	email: string;
	@IsString()
	@IsNotEmpty()
	password: string;
}
