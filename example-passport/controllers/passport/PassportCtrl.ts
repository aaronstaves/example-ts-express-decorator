"use strict";

import {NotFound} from "ts-httpexceptions";
import * as Express from "express";
import Events = require('events');
import * as Promise from "bluebird";
import EventEmitter = NodeJS.EventEmitter;
import {Controller, Get, Post, BodyParams, Required, Request, Response, Next} from "ts-express-decorators";
import PassportLocalService from '../../services/PassportLocalService';
import {IUser} from '../../services/UsersService';
import * as Passport from 'passport';

@Controller("/passport")
class PassportCtrl{

    constructor(
        private passportLocalService: PassportLocalService
    ) {
        passportLocalService.initLocalSignup();
        passportLocalService.initLocalLogin();
    }

    /**
     * Authenticate user with local info (in Database).
     * @param email
     * @param password
     * @param request
     * @param response
     * @param next
     */
    @Post('/login')
    public login(
        @Required() @BodyParams('email') email: string,
        @Required() @BodyParams('password') password: string,
        @Request() request: Express.Request,
        @Response() response: Express.Response,
        @Next() next: Express.NextFunction
    ) {
        console.log('resquest.cookies', request.cookies);

        return new Promise<IUser>((resolve, reject) => {

            try{
                Passport
                    .authenticate('login', (err, user: IUser) => {

                        if (err) {
                            reject(err);
                        }

                        request.logIn(user, (err) => {

                            if (err) {
                                reject(err);
                            }

                            resolve(user);
                        });

                    })(request, response, next);
            }catch (er){
                console.error(er);
            }
        })
            .catch((err) => {

                if(err && err.message === "Failed to serialize user into session") {
                    throw new NotFound('user not found');
                }

                return Promise.reject(err);
            });

    }

    /**
     * Try to register new account
     * @param request
     * @param response
     * @param next
     */
    @Post('/signup')
    public signup(
        @Request() request: Express.Request,
        @Response() response: Express.Response,
        @Next() next: Express.NextFunction
    ) {
        return new Promise((resolve, reject) =>  {

            Passport.authenticate('signup', (err, user: IUser) => {

                if(err){
                    reject(err);
                }

                if(!user) {
                    reject(!!err);
                }

                request.logIn(user, (err) => {

                    if (err) {
                        return reject(err);
                    }

                    resolve(user);

                });
            })(request, response, next);
        });
    }

    /**
     * Disconnect user
     * @param request
     */
    @Get('/logout')
    public logout(@Request() request:Express.Request) {
        request.logout();
        return "Disconnected";
    }
}