import { AuthService } from '../../auth/auth.service';
import { JwtService } from '@nestjs/jwt';

// Mocks for Mongoose models
function createModelMock() {
  return {
    create: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn(),
    lean: jest.fn(),
  } as any;
}

describe('AuthService refresh rotation', () => {
  let service: AuthService;
  let jwt: JwtService;
  let userModel: any;
  let customerModel: any;
  let restaurantModel: any;
  let driverModel: any;
  let refreshModel: any;

  beforeEach(() => {
    process.env.REFRESH_HMAC_SECRET = 'test-secret';
    jwt = { signAsync: jest.fn().mockResolvedValue('access-token') } as any;
    userModel = createModelMock();
    customerModel = createModelMock();
    restaurantModel = createModelMock();
    driverModel = createModelMock();
    refreshModel = createModelMock();
    service = new AuthService(
      jwt,
      userModel,
      customerModel,
      restaurantModel,
      driverModel,
      refreshModel,
    );
  });

  const mockReq = (cookies: Record<string, string> = {}, headers: Record<string, string> = {}) => ({
    cookies,
    headers,
    ip: '127.0.0.1',
  } as any);

  it('mintRefreshToken should create active row with jti, tokenHash and csrf', async () => {
    const user = { _id: 'u1', email: 'a@b.com', role: 'customer' };
    const req = mockReq({}, { 'x-device-id': 'dev1', 'user-agent': 'jest' });
    (refreshModel.create as jest.Mock).mockResolvedValue({});
    const anyService: any = service;
    const result = await anyService.mintRefreshToken(user, req);
    expect(result.raw).toBeDefined();
    expect(result.jti).toBeDefined();
    expect(result.csrf).toBeDefined();
    expect(refreshModel.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'u1',
      status: 'active',
      jti: expect.any(String),
      tokenHash: expect.any(String),
      csrf: expect.any(String),
    }));
  });

  it('rotateRefreshToken happy path rotates old and issues new tokens', async () => {
    const user = { _id: 'u1', email: 'a@b.com', role: 'customer' };
    const req = mockReq({}, { 'x-device-id': 'dev1', 'user-agent': 'jest' });
    // Prepare a real token using the private method to ensure HMAC matches
    const anyService: any = service;
    (refreshModel.create as jest.Mock).mockResolvedValue({ toObject: () => ({}) });
    const minted = await anyService.mintRefreshToken(user, req);
    const raw = minted.raw;
    const [tokenPart, jti] = raw.split('.');

    // DB has an active row
    (refreshModel.findOne as jest.Mock).mockResolvedValue({ userId: 'u1', jti, tokenHash: anyService.hmac(raw), status: 'active' });
    (userModel.findById as jest.Mock).mockResolvedValue({ lean: () => ({ _id: 'u1', email: 'a@b.com', role: 'customer' }) });
    (refreshModel.updateOne as jest.Mock).mockResolvedValue({ modifiedCount: 1 });

    const res = await service.rotateRefreshToken(mockReq({ refresh_token: raw }, { 'x-device-id': 'dev1', 'user-agent': 'jest' }));
    expect(res.access_token).toBe('access-token');
    expect(res.refresh_token).toBeDefined();
    expect(refreshModel.updateOne).toHaveBeenCalledWith({ jti, status: 'active' }, expect.any(Object));
  });

  it('rotateRefreshToken replay when status != active should revoke all and throw', async () => {
    const raw = 'deadbeef.abc';
    const anyService: any = service;
    (refreshModel.findOne as jest.Mock).mockResolvedValue({ userId: 'u1', jti: 'abc', tokenHash: anyService.hmac(raw), status: 'rotated' });
    await expect(service.rotateRefreshToken(mockReq({ refresh_token: raw }))).rejects.toThrow();
    expect(refreshModel.updateMany).toHaveBeenCalledWith({ userId: 'u1' }, expect.any(Object));
  });

  it('rotateRefreshToken replay when race (0 modified) revokes all and throws', async () => {
    const user = { _id: 'u1', email: 'a@b.com', role: 'customer' };
    const anyService: any = service;
    (refreshModel.create as jest.Mock).mockResolvedValue({ toObject: () => ({}) });
    const minted = await anyService.mintRefreshToken(user, mockReq());
    const raw = minted.raw;
    const jti = raw.split('.')[1];
    (refreshModel.findOne as jest.Mock).mockResolvedValue({ userId: 'u1', jti, tokenHash: anyService.hmac(raw), status: 'active' });
    (userModel.findById as jest.Mock).mockResolvedValue({ lean: () => ({ _id: 'u1', email: 'a@b.com', role: 'customer' }) });
    (refreshModel.updateOne as jest.Mock).mockResolvedValue({ modifiedCount: 0 });
    await expect(service.rotateRefreshToken(mockReq({ refresh_token: raw }))).rejects.toThrow();
    expect(refreshModel.updateMany).toHaveBeenCalledWith({ userId: 'u1' }, expect.any(Object));
  });

  it('revokeCurrentRefreshToken marks token revoked', async () => {
    (refreshModel.updateOne as jest.Mock).mockResolvedValue({});
    await service.revokeCurrentRefreshToken(mockReq({ refresh_token: 'dead.beef' }));
    expect(refreshModel.updateOne).toHaveBeenCalledWith({ jti: 'beef' }, expect.any(Object));
  });
});


