import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Not, IsNull } from "typeorm";

import { User } from "@/entitys/user.entity";
import { Password } from "@/entitys/password.entity";
import { Role } from "@/entitys/role.entity";
import { Command } from "@/entitys/command.entity";

import { CreateUserDto } from "@/entitys/dto/create-user.dto";

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Password)
        private passwordsRepository: Repository<Password>,
        @InjectRepository(Role)
        private rolesRepository: Repository<Role>,
        @InjectRepository(Command)
        private commandsRepository: Repository<Command>,
    ) { }

    async createUser(createUserDto: CreateUserDto): Promise<User> {
        const cu = await this.getUserByUid(createUserDto.uid);
        const cr = await this.getRoleById(createUserDto.roleId);
        if (!cu) {
            if (cr) {
                console.log("before");
                const user = new User();
                console.log("after");
                user.name = createUserDto.name;
                user.username = createUserDto.username;
                user.uid = createUserDto.uid;
                user.role = cr;
                console.log(">>> New user:", user);

                return this.usersRepository.save(user);
            } else {
                throw (new Error("Роль не найдена!"));
            }
        } else {
            throw (new Error("Пользователь уже добавлен!"));
        }
    }

    async setUserRole(userId: number, roleId: number): Promise<User> {
        const user = await this.getUserById(userId);
        const role = await this.getRoleById(roleId);
        if (user) {
            if (role) {
                user.role = role;
                return this.usersRepository.save(user);
            } else {
                throw (new Error("Роль не найдена!"));
            }
        } else {
            throw (new Error("Пользователь не найден!"));
        }
    }

    async getUserById(id: number): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id }, relations: { role: true } });
    }

    async getUserByUid(uid: number): Promise<User | null> {
        return this.usersRepository.findOne({ where: { uid }, relations: { role: true } });
    }

    async getRoleById(id: number): Promise<Role | null> {
        return this.rolesRepository.findOneBy({ id });
    }

    async findAllAdmins(): Promise<User[] | null> {
        return this.usersRepository
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.role", "role")
            .where("role.name = 'admin'")
            .getMany();
    }

    async getUserCommands(id: number): Promise<Command[] | null> {
        const user = await this.getUserById(id);
        if (user) {
            return this.commandsRepository
                .createQueryBuilder("command")
                .where("roles LIKE :role", { role: `%${user.role.name}%` })
                .getMany();
        } else {
            throw (new Error("Пользователь не найден!"));
        }
    }

    async findPassword(password: string): Promise<Password | null> {
        return this.passwordsRepository.findOne({ where: { password }, relations: { role: true } });
    }

    /*    
    async findAllCameras(): Promise<Camera[]> {
        return this.camerasRepository.find();
    }

    async getCamera(id: number): Promise<Camera | null> {
        return this.camerasRepository.findOneBy({ id });
    }

    async findAllDevices(): Promise<Device[]> {
        return this.devicesRepository.find({
            relations: {
                sensors: true,
                controls: true,
            },
        });
    }

    async findAllSensoredDevices(): Promise<Device[]> {
        const devices = this.devicesRepository
            .createQueryBuilder("device")
            .leftJoinAndSelect("device.sensors", "sensor")
            .where("sensor.id IS NOT NULL")
            .getMany();

        return devices;
    }

    async findAllControlledDevices(): Promise<Device[]> {

        const devices = this.devicesRepository
            .createQueryBuilder("device")
            .leftJoinAndSelect("device.controls", "control")
            .where("control.id IS NOT NULL")
            .getMany();

        return devices;
    }

    async getDevice(id: number): Promise<Device | null> {
        return this.devicesRepository.findOne({
            where: {
                id: id,
            },
            relations: {
                sensors: true,
                controls: true,
            },
        });
    }

    async findAllSensors(): Promise<Sensor[]> {
        return this.sensorsRepository.find({
            relations: {
                device: true,
            },
        });
    }

    async getSensor(id: number): Promise<Sensor | null> {
        return this.sensorsRepository.findOne({
            where: {
                id: id,
            },
            relations: {
                device: true,
            },
        });
    }
    async findAllControls(): Promise<Control[]> {
        const controls = this.controlsRepository
            .createQueryBuilder("controls")
            .leftJoinAndSelect("controls.device", "device")
            //.select("controls.device")
            .distinctOn(["controls.device"])
            //.where("device.controls IS NOT NULL")
            .getMany();

        return controls;
    }

    async getControl(id: number): Promise<Control | null> {
        return this.controlsRepository.findOne({
            where: {
                id: id,
            },
            relations: {
                device: true,
            },
        });
    }
*/

}
