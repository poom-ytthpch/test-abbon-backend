import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginInput, LoginResponse, RegisterInput, User } from 'src/types/gql';

@Resolver('Auth')
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => User)
  register(@Args('input') input: RegisterInput) {
    return this.authService.register(input);
  }

  @Mutation(() => LoginResponse)
  login(@Args('input') input: LoginInput) {
    return this.authService.login(input);
  }
}
