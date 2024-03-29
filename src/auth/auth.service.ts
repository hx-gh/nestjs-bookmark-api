import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable({})
export class AuthService {
	constructor(
		private prisma: PrismaService,
		private jwt: JwtService,
		private config: ConfigService,
	) {}
	async signup(dto: AuthDto): Promise<object> {
		try {
			//generate the password hash
			const hash = await argon.hash(dto.password);
			//save the new user in the db
			const user = await this.prisma.user.create({
				data: {
					email: dto.email,
					hash,
				},
				select: {
					id: true,
					email: true,
					firstName: true,
					lastName: true,
				},
			});
			//return the saved user and jwt token
			const jwt = await this.signToken(user.id, user.email);
			return {
				status: true,
				message: 'User created successfully',
				user,
				jwt,
			};
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === 'P2002') {
					throw new ForbiddenException('Credentials taken');
				}
			}
		}
	}
	async signin(dto: AuthDto): Promise<object> {
		//find the user by email
		const user = await this.prisma.user.findUnique({
			where: {
				email: dto.email,
			},
		});
		//if uer doest not exist throw exception
		if (!user) throw new ForbiddenException('Incorrect credentials');
		//compare pass
		const pwMatches = await argon.verify(user.hash, dto.password);
		//if password is incorrect throw exception
		if (!pwMatches)
			throw new ForbiddenException('Incorrect credentials');
		//send back the JWT
		const jwt = await this.signToken(user.id, user.email);
		return {
			status: true,
			message: 'User created successfully',
			user,
			jwt,
		};
	}
	signToken(userId: number, email: string): Promise<string> {
		const data = {
			sub: userId,
			email,
		};
		const secret = this.config.get('JWT_SECRET');
		return this.jwt.signAsync(data, {
			expiresIn: '15m',
			secret: secret,
		});
	}
}
