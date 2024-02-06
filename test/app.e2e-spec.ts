import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';
import { AuthDto } from 'src/auth/dto';
import { EditUserDto } from 'src/user/dto';
import { CreateBookmarkDto, EditBookmarkDto } from 'src/bookmark/dto';

describe('App e2e', () => {
	let app: INestApplication;
	let prisma: PrismaService;
	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();
		app = moduleRef.createNestApplication();
		app.useGlobalPipes(
			new ValidationPipe({
				whitelist: true,
			}),
		);
		await app.init();
		await app.listen(7777);
		prisma = app.get(PrismaService);
		await prisma.cleanDb();
		pactum.request.setBaseUrl('http://localhost:7777');
	});
	afterAll(() => {
		app.close();
	});
	describe('Auth', () => {
		const dto: AuthDto = {
			email: 'test@mail.com',
			password: '123',
		};
		describe('Signup', () => {
			it('Should throw error if email empty', () => {
				return pactum
					.spec()
					.post('/auth/signup')
					.withBody({ password: dto.password })
					.expectStatus(400);
			});
			it('Should throw error if password empty', () => {
				return pactum
					.spec()
					.post('/auth/signup')
					.withBody({ email: dto.email })
					.expectStatus(400);
			});
			it('Should throw error if no body provided', () => {
				return pactum
					.spec()
					.post('/auth/signup')
					.withBody({})
					.expectStatus(400);
			});
			it('Should signup', () => {
				return pactum
					.spec()
					.post('/auth/signup')
					.withBody(dto)
					.expectStatus(201);
			});
		});
		describe('Signin', () => {
			it('Should throw error if email empty', () => {
				return pactum
					.spec()
					.post('/auth/signin')
					.withBody({ password: dto.password })
					.expectStatus(400);
			});
			it('Should throw error if password empty', () => {
				return pactum
					.spec()
					.post('/auth/signin')
					.withBody({ email: dto.email })
					.expectStatus(400);
			});
			it('Should throw error if no body provided', () => {
				return pactum
					.spec()
					.post('/auth/signin')
					.withBody({})
					.expectStatus(400);
			});
			it('Should signin', () => {
				return pactum
					.spec()
					.post('/auth/signin')
					.withBody(dto)
					.expectStatus(200)
					.stores('userAt', 'jwt');
			});
		});
	});
	describe('User', () => {
		describe('Get me', () => {
			it('Should get current user', () => {
				return pactum
					.spec()
					.get('/users/me')
					.expectStatus(200)
					.withHeaders({
						Authorization: 'Bearer $S{userAt}',
					});
			});
		});
		describe('Edit user', () => {
			it('Should edit user', () => {
				const dto: EditUserDto = {
					firstName: 'Gustavo',
					lastName: 'Silva',
				};
				return pactum
					.spec()
					.patch('/users')
					.expectStatus(200)
					.withHeaders({
						Authorization: 'Bearer $S{userAt}',
					})
					.withBody(dto);
			});
		});
	});
	describe('Bookmarks', () => {
		describe('Create bookmark', () => {
			it('Should create a bookmark', () => {
				const dto: CreateBookmarkDto = {
					title: 'Test bookmark',
					link: 'https://www.youtube.com/watch?v=GHTA143_b-s&t=11552s',
					description: 'Very good way to learn NestJs',
				};
				return pactum
					.spec()
					.post('/bookmarks')
					.withBody(dto)
					.withHeaders({
						Authorization: 'Bearer $S{userAt}',
					})
					.expectStatus(201)
					.stores('bookmarkId', 'id');
			});
		});
		describe('Get bookmark by id', () => {
			it('Should get bookmark by id', () => {
				return pactum
					.spec()
					.get('/bookmarks/{id}')
					.withPathParams('id', '$S{bookmarkId}')
					.expectStatus(200)
					.withHeaders({
						Authorization: 'Bearer $S{userAt}',
					})
					.expectJsonLength(1);
			});
		});
		describe('Edit bookmark', () => {
			it('Should edit bookmark', () => {
				const dto: EditBookmarkDto = {
					title: 'A way coll title',
					description: 'a way coll description',
				};
				return pactum
					.spec()
					.patch('/bookmarks/{id}')
					.expectStatus(200)
					.withPathParams('id', '$S{bookmarkId}')
					.withHeaders({
						Authorization: 'Bearer $S{userAt}',
					})
					.withBody(dto)
					.expectBodyContains(dto.title)
					.expectBodyContains(dto.description);
			});
		});
		describe('Delete bookmark', () => {
			it('Should delete bookmark', () => {
				return pactum
					.spec()
					.delete('/bookmarks/{id}')
					.expectStatus(204)
					.withPathParams('id', '$S{bookmarkId}')
					.withHeaders({
						Authorization: 'Bearer $S{userAt}',
					});
			});
		});
		describe('Get empty bookmarks', () => {
			it('Should empty bookmarks', () => {
				return pactum
					.spec()
					.get('/bookmarks')
					.expectStatus(200)
					.withHeaders({
						Authorization: 'Bearer $S{userAt}',
					})
					.expectBody([]);
			});
		});
	});
});
