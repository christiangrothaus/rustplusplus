export default abstract class BaseNotificationInfo {
  public message: string;

  public name: string;

  constructor(name: string, message: string) {
    this.message = message;
    this.name = name;
  }
}